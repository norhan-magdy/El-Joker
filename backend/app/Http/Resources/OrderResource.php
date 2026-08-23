<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'total_amount' => (float) $this->total_amount,
            'shipping_address' => $this->shipping_address,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'invoice' => new InvoiceResource($this->whenLoaded('invoice')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'user_id' => $this->when($request->user()?->hasPermissionTo('orders.manage'), fn () => $this->user_id),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
