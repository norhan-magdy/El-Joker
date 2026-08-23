<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $products,
        private readonly PermissionService $permissions,
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $withInactive = $request->user()?->hasPermissionTo('products.manage') ?? false;

        return ProductResource::collection(
            $this->products->list(
                search: $request->query('q'),
                categorySlug: $request->query('category'),
                withInactive: $withInactive,
            )
        );
    }

    public function show(Product $product): ProductResource
    {
        $withInactive = request()->user()?->hasPermissionTo('products.manage') ?? false;

        return new ProductResource($this->products->find($product->id, $withInactive));
    }

    public function store(StoreProductRequest $request): ProductResource
    {
        return new ProductResource($this->products->create($request->validated()));
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        return new ProductResource($this->products->update($product, $request->validated()));
    }

    public function destroy(Product $product): \Illuminate\Http\JsonResponse
    {
        $this->products->delete($product);

        return response()->json(['message' => 'Product deleted.']);
    }
}
