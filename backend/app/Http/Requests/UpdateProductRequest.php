<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['sometimes', Rule::exists('categories', 'id')],
            'price' => ['sometimes', 'numeric', 'min:0', 'max:9999999999.99'],
            'image_url' => ['sometimes', 'url', 'max:255'],
            'description' => ['nullable', 'string'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($this->route('product'))],
        ];
    }
}
