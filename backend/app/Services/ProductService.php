<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function list(
        ?string $search = null,
        ?array $categorySlugs = null,
        bool $withInactive = false,
        ?float $minPrice = null,
        ?float $maxPrice = null,
        string $sort = 'newest',
        bool $inStockOnly = false,
    ): LengthAwarePaginator {
        return Product::query()
            ->with(['category', 'inventory'])
            ->when(! $withInactive, fn ($query) => $query->where('is_active', true))
            ->when($search, fn ($query) => $query->where(fn ($q) => $q
                ->where('title', 'ilike', "%{$search}%")
                ->orWhere('description', 'ilike', "%{$search}%")))
            ->when($categorySlugs, fn ($query) => $query->whereHas(
                'category',
                fn ($q) => $q->whereIn('slug', $categorySlugs)
            ))
            ->when($minPrice !== null, fn ($query) => $query->where('price', '>=', $minPrice))
            ->when($maxPrice !== null, fn ($query) => $query->where('price', '<=', $maxPrice))
            ->when($inStockOnly, fn ($query) => $query->whereHas(
                'inventory',
                fn ($q) => $q->where('quantity', '>', 0)
            ))
            ->when($sort === 'price-asc', fn ($query) => $query->orderBy('price', 'asc'))
            ->when($sort === 'price-desc', fn ($query) => $query->orderBy('price', 'desc'))
            ->when(! in_array($sort, ['price-asc', 'price-desc'], true), fn ($query) => $query->latest())
            ->paginate(15);
    }

    public function priceRange(): array
    {
        $range = Product::query()
            ->where('is_active', true)
            ->selectRaw('MIN(price) as min_price, MAX(price) as max_price')
            ->first();

        return [
            'min' => (float) ($range->min_price ?? 0),
            'max' => (float) ($range->max_price ?? 0),
        ];
    }

    public function find(string $id, bool $withInactive = false): Product
    {
        $product = Product::with(['category', 'inventory'])->findOrFail($id);

        abort_if(
            ! $product->is_active && ! $withInactive,
            Response::HTTP_NOT_FOUND,
        );

        return $product;
    }

    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $stock = $data['stock'] ?? 0;
            unset($data['stock']);

            $product = Product::create([
                ...$data,
                'slug' => $this->uniqueSlug($data['slug'] ?? $data['title']),
            ]);

            $product->inventory()->create(['quantity' => $stock]);

            return $product->load(['category', 'inventory']);
        });
    }

    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $stock = $data['stock'] ?? null;
            unset($data['stock']);

            if (isset($data['title'])) {
                $data['slug'] ??= $this->uniqueSlug($data['title'], $product->id);
            }
            if (isset($data['slug'])) {
                $data['slug'] = $this->uniqueSlug($data['slug'], $product->id);
            }

            $product->update($data);

            if ($stock !== null) {
                $product->inventory()->updateOrCreate(
                    ['product_id' => $product->id],
                    ['quantity' => $stock]
                );
            }

            return $product->refresh()->load(['category', 'inventory']);
        });
    }

    public function delete(Product $product): void
    {
        DB::transaction(function () use ($product) {
            $product->inventory()->delete();
            $product->delete();
        });
    }

    private function uniqueSlug(string $source, ?string $ignoreId = null): string
    {
        $base = Str::slug($source);
        $slug = $base;
        $i = 1;

        while (
            Product::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.++$i;
        }

        return $slug;
    }
}
