<?php

namespace App\Http\Requests;

use App\Services\OrderService;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:' . implode(',', OrderService::STATUSES)],
        ];
    }
}
