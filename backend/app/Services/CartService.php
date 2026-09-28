<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
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
            ->with('product.category')
            ->get();
    }

    public function addItem(User $user, string $productId, int $quantity): CartItem
    {
        return DB::transaction(function () use ($user, $productId, $quantity) {
            $product = Product::where('is_active', true)->findOrFail($productId);

            $inventory = $product->inventory()->lockForUpdate()->first();
            abort_if(
                ! $inventory || $inventory->quantity < 1,
                Response::HTTP_CONFLICT,
                'Product is out of stock.'
            );

            $cart = $user->cart()->lockForUpdate()->first() ?? $this->getCart($user);

            $item = $cart
                ->items()
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            $requested = ($item?->quantity ?? 0) + $quantity;

            abort_if(
                $requested > $inventory->quantity,
                Response::HTTP_CONFLICT,
                "Only {$inventory->quantity} left in stock for '{$product->title}'."
            );

            if ($item) {
                $item->increment('quantity', $quantity);

                return $item->refresh()->load('product.category');
            }

            return $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $quantity,
            ])->load('product.category');
        }, 3);
    }

    public function updateItem(User $user, string $itemId, int $quantity): CartItem
    {
        $item = $user->cart->items()->findOrFail($itemId);
        $item->update(['quantity' => $quantity]);

        return $item->load('product.category');
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
