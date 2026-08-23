<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class CategoryService
{
    public function list(): LengthAwarePaginator
    {
        return Category::with('parent')
            ->withCount('products')
            ->orderBy('name')
            ->paginate(20);
    }

    public function create(array $data): Category
    {
        return Category::create([
            ...$data,
            'slug' => $this->uniqueSlug($data['slug'] ?? $data['name']),
        ]);
    }

    public function update(Category $category, array $data): Category
    {
        if (isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $category->id);
        } elseif (isset($data['name']) && $data['name'] !== $category->name && ! isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], $category->id);
        }

        $category->update($data);

        return $category->refresh();
    }

    public function delete(Category $category): void
    {
        abort_if(
            $category->children()->exists() || $category->products()->exists(),
            409,
            'Category has children or products and cannot be deleted.'
        );

        $category->delete();
    }

    private function uniqueSlug(string $source, ?string $ignoreId = null): string
    {
        $base = Str::slug($source);
        $slug = $base;
        $i = 1;

        while (
            Category::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . ++$i;
        }

        return $slug;
    }
}
