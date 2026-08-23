<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', Rule::exists('categories', 'id')],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'image_url' => ['required', 'url', 'max:255'],
            'description' => ['nullable', 'string'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
        ];
    }
}
