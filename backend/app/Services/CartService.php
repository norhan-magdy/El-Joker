<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CartService
{
    public function getCart(User $user): Cart
    {
        $cart = $user->cart()->first();

        if ($cart) {
            return $cart;
        }

        $user->cart()->insertOrIgnore([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $user->cart()->firstOrFail();
    }

    public function items(User $user)
    {
        return $this->getCart($user)
            ->items()
            ->with(['product.category', 'product.inventory'])
            ->get();
    }

    public function addItem(User $user, string $productId, int $quantity): CartItem
    {
        return DB::transaction(function () use ($user, $productId, $quantity) {
            $product = Product::where('is_active', true)->findOrFail($productId);

            $inventory = $product->inventory()->lockForUpdate()->first();

            throw_if(
                ! $inventory || $inventory->quantity < 1,
                new InsufficientStockException($product->id, $quantity, 0, $product->title),
            );

            $cart = $user->cart()->lockForUpdate()->first() ?? $this->getCart($user);

            $item = $cart
                ->items()
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            $requested = ($item?->quantity ?? 0) + $quantity;

            throw_if(
                $requested > $inventory->quantity,
                new InsufficientStockException(
                    $product->id,
                    $requested,
                    (int) $inventory->quantity,
                    $product->title,
                ),
            );

            if ($item) {
                $item->increment('quantity', $quantity);

                return $item->refresh()->load('product.category', 'product.inventory');
            }

            return $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $quantity,
            ])->load('product.category', 'product.inventory');
        }, 3);
    }

    public function updateItem(User $user, string $itemId, int $quantity): CartItem
    {
        return DB::transaction(function () use ($user, $itemId, $quantity) {
            $preReadProductId = CartItem::query()
                ->where('id', $itemId)
                ->whereIn('cart_id', $user->cart()->select('id'))
                ->value('product_id');

            abort_unless($preReadProductId, 404);

            $inventory = Inventory::query()
                ->where('product_id', $preReadProductId)
                ->lockForUpdate()
                ->first();

            $cart = $user->cart()->lockForUpdate()->first();

            abort_unless($cart, 404);

            $item = $cart->items()->where('id', $itemId)->lockForUpdate()->first();

            abort_unless($item, 404);

            abort_if(
                $item->product_id !== $preReadProductId,
                Response::HTTP_CONFLICT,
                'Cart item changed, please retry.',
            );

            throw_if(
                ! $inventory || $quantity > $inventory->quantity,
                new InsufficientStockException(
                    $item->product_id,
                    $quantity,
                    (int) ($inventory?->quantity ?? 0),
                    $item->product->title,
                ),
            );

            $item->update(['quantity' => $quantity]);

            return $item->load('product.category', 'product.inventory');
        }, 3);
    }

    public function removeItem(User $user, string $itemId): void
    {
        $user->cart->items()->findOrFail($itemId)->delete();
    }

    public function clear(User $user): void
    {
        $this->getCart($user)->items()->delete();
    }
}
