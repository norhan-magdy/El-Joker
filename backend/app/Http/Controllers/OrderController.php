<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Services\InvoiceService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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

    public function invoicePdf(string $order): BinaryFileResponse
    {
        $order = $this->orders->find(request()->user(), $order);

        $invoice = $order->invoice;

        abort_unless(
            $invoice && File::exists($this->invoices->absolutePathFor($invoice)),
            404,
            'Invoice PDF is not available for this order.',
        );

        return response()->file($this->invoices->absolutePathFor($invoice), [
            'Content-Type' => 'application/pdf',
        ]);
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
