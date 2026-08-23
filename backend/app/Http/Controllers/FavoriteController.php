<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Services\FavoriteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FavoriteController extends Controller
{
    public function __construct(private readonly FavoriteService $favorites)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        return ProductResource::collection($this->favorites->list(request()->user()));
    }

    public function store(Request $request): JsonResponse
    {
        $this->favorites->add(request()->user(), $request->validate([
            'product_id' => ['required', 'uuid', 'exists:products,id'],
        ])['product_id']);

        return response()->json(['message' => 'Product added to favorites.'], 201);
    }

    public function destroy(string $product): JsonResponse
    {
        $this->favorites->remove(request()->user(), $product);

        return response()->json(['message' => 'Product removed from favorites.']);
    }
}
