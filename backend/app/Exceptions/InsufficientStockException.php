<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use RuntimeException;

class InsufficientStockException extends RuntimeException implements Responsable
{
    public function __construct(
        public readonly string $productId,
        public readonly int $requested,
        public readonly int $available,
        public readonly ?string $productTitle = null,
    ) {
        parent::__construct($this->buildMessage());
    }

    public function toResponse($request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code' => 'insufficient_stock',
            'product_id' => $this->productId,
            'requested' => $this->requested,
            'available' => $this->available,
        ], Response::HTTP_CONFLICT);
    }

    private function buildMessage(): string
    {
        if ($this->available < 1) {
            return 'Product is out of stock.';
        }

        $stock = "Only {$this->available} left in stock";

        return $this->productTitle
            ? "{$stock} for '{$this->productTitle}'."
            : "{$stock}.";
    }
}
