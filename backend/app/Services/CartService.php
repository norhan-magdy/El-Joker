<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class CartService
{
    public function getCart(User $user): Cart
    {
        return $user->cart()->firstOrCreate([]);
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

            $item = $this->getCart($user)
                ->items()
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            if ($item) {
                $item->increment('quantity', $quantity);

                return $item->refresh()->load('product.category');
            }

            return $this->getCart($user)->items()->create([
                'product_id' => $product->id,
                'quantity' => $quantity,
            ])->load('product.category');
        });
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
