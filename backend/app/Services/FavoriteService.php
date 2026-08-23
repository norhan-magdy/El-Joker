<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Response;

class FavoriteService
{
    public function list(User $user)
    {
        return $user->favorites()
            ->with('category', 'inventory')
            ->orderBy('favorites.created_at', 'desc')
            ->get();
    }

    public function add(User $user, string $productId): void
    {
        Product::where('is_active', true)->findOrFail($productId);

        $user->favorites()->syncWithoutDetaching([$productId]);
    }

    public function remove(User $user, string $productId): void
    {
        abort_if(
            ! $user->favorites()->where('products.id', $productId)->exists(),
            Response::HTTP_NOT_FOUND,
        );

        $user->favorites()->detach($productId);
    }
}
