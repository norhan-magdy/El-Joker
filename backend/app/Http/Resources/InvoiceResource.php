<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'pdf_url' => $this->pdf_url,
            'issued_at' => $this->issued_at?->toIso8601String(),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order->id,
                'status' => $this->order->status,
                'total_amount' => (float) $this->order->total_amount,
                'shipping_address' => $this->order->shipping_address,
                'created_at' => $this->order->created_at?->toIso8601String(),
                'items' => $this->when(
                    $this->order->relationLoaded('items'),
                    fn () => OrderItemResource::collection($this->order->items)
                ),
                'payments' => $this->when(
                    $this->order->relationLoaded('payments'),
                    fn () => PaymentResource::collection($this->order->payments)
                ),
            ]),
            'customer' => $this->whenLoaded('order', fn () => $this->when(
                $this->order->relationLoaded('user'),
                fn () => [
                    'name' => $this->order->user->name,
                    'email' => $this->order->user->email,
                ]
            )),
            'items_count' => $this->when($this->relationLoaded('order'), fn () => $this->when(
                $this->order->relationLoaded('items'),
                fn () => $this->order->items->count()
            )),
        ];
    }
}
