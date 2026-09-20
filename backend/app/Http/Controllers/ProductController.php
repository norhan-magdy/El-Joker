<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\PermissionService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $products,
        private readonly PermissionService $permissions,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $withInactive = $request->user()?->hasPermissionTo('products.manage') ?? false;

        $categories = $request->query('categories');
        $categorySlugs = match (true) {
            is_string($categories) && $categories !== '' => array_values(array_filter(
                array_map('trim', explode(',', $categories)),
                fn (string $slug) => $slug !== ''
            )),
            default => null,
        };

        $minRaw = $request->query('min');
        $maxRaw = $request->query('max');
        $minPrice = is_numeric($minRaw) ? (float) max(0, $minRaw) : null;
        $maxPrice = is_numeric($maxRaw) ? (float) $maxRaw : null;
        if ($minPrice !== null && $maxPrice !== null && $maxPrice < $minPrice) {
            $maxPrice = $minPrice;
        }

        $sort = $request->query('sort');
        $sort = is_string($sort) && in_array($sort, ['newest', 'price-asc', 'price-desc'], true) ? $sort : 'newest';

        $inStockOnly = filter_var($request->query('in_stock'), FILTER_VALIDATE_BOOLEAN);

        return ProductResource::collection(
            $this->products->list(
                search: $request->query('q'),
                categorySlugs: $categorySlugs,
                withInactive: $withInactive,
                minPrice: $minPrice,
                maxPrice: $maxPrice,
                sort: $sort,
                inStockOnly: $inStockOnly,
            )
        )->additional(['price_range' => $this->products->priceRange()]);
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

    public function destroy(Product $product): JsonResponse
    {
        $this->products->delete($product);

        return response()->json(['message' => 'Product deleted.']);
    }
}
