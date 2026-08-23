<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Services\CategoryService;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categories)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection($this->categories->list());
    }

    public function store(StoreCategoryRequest $request): CategoryResource
    {
        return new CategoryResource($this->categories->create($request->validated()));
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('parent')->loadCount('products'));
    }

    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        return new CategoryResource($this->categories->update($category, $request->validated()));
    }

    public function destroy(Category $category): \Illuminate\Http\JsonResponse
    {
        $this->categories->delete($category);

        return response()->json(['message' => 'Category deleted.']);
    }
}
