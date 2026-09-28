<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly InvoiceService $invoices,
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        return OrderResource::collection($this->orders->listFor(request()->user()));
    }

    public function store(CheckoutRequest $request): OrderResource
    {
        return new OrderResource(
            $this->orders->checkout(request()->user(), $request->input('shipping_address'))
        );
    }

    public function show(string $order): OrderResource
    {
        return new OrderResource($this->orders->find(request()->user(), $order));
    }

    public function invoicePdf(string $order): StreamedResponse
    {
        return $this->invoices->download($this->availableInvoice($order));
    }

    public function invoicePdfLink(string $order): JsonResponse
    {
        $invoice = $this->availableInvoice($order);

        return response()->json([
            'url' => $this->invoices->temporaryUrlFor($invoice),
            'expires_in_minutes' => (int) config('invoices.signed_url_minutes', 10),
        ]);
    }

    private function availableInvoice(string $orderId): Invoice
    {
        $invoice = $this->orders->find(request()->user(), $orderId)->invoice;

        abort_unless(
            $invoice && $this->invoices->exists($invoice),
            404,
            'Invoice PDF is not available for this order.',
        );

        return $invoice;
    }

    public function update(UpdateOrderStatusRequest $request, string $order): OrderResource
    {
        return new OrderResource(
            $this->orders->updateStatus(
                $this->orders->find(request()->user(), $order),
                $request->input('status')
            )
        );
    }

    public function pay(Request $request, string $order): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'max:255'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
        ]);

        $payment = $this->orders->recordPayment(
            $this->orders->find(request()->user(), $order),
            $validated['provider'],
            $validated['transaction_id'] ?? null,
        );

        return response()->json(['message' => 'Payment recorded.', 'payment' => [
            'id' => $payment->id,
            'provider' => $payment->provider,
            'amount' => (float) $payment->amount,
            'status' => $payment->status,
        ]], 201);
    }
}
