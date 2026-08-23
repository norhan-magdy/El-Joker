<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(
                    fn ($query) => $query->whereNot('id', $this->route('category')->id)
                ),
            ],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($this->route('category'))],
        ];
    }
}
