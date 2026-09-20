<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoices) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return InvoiceResource::collection(
            $this->invoices->listForAdmin($request->query('q'))
        );
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        $invoice->load(['order.items.product', 'order.payments', 'order.user']);

        return new InvoiceResource($invoice);
    }

    public function regenerate(Invoice $invoice): JsonResponse
    {
        $this->invoices->regenerate($invoice);

        return response()->json([
            'message' => 'Invoice PDF generation queued.',
            'data' => new InvoiceResource($invoice),
        ], 202);
    }
}
