<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartItemResource;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CartItemController extends Controller
{
    public function __construct(private readonly CartService $cart)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        return CartItemResource::collection($this->cart->items(request()->user()));
    }

    public function store(StoreCartItemRequest $request): CartItemResource
    {
        $item = $this->cart->addItem(
            request()->user(),
            $request->input('product_id'),
            (int) $request->input('quantity', 1),
        );

        return new CartItemResource($item);
    }

    public function update(UpdateCartItemRequest $request, string $item): CartItemResource
    {
        return new CartItemResource(
            $this->cart->updateItem(request()->user(), $item, (int) $request->input('quantity'))
        );
    }

    public function destroy(string $item): JsonResponse
    {
        $this->cart->removeItem(request()->user(), $item);

        return response()->json(['message' => 'Item removed.']);
    }
}
