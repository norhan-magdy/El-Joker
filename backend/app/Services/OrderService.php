<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

    public function __construct(private readonly InvoiceService $invoices)
    {
    }

    public function listFor(User $user): LengthAwarePaginator
    {
        return Order::query()
            ->with(['items.product', 'invoice', 'payments'])
            ->when(
                ! app(PermissionService::class)->userHasPermission($user, 'orders.manage'),
                fn ($query) => $query->where('user_id', $user->id)
            )
            ->latest()
            ->paginate(15);
    }

    public function find(User $user, string $orderId): Order
    {
        $order = Order::with(['items.product', 'invoice', 'payments'])->findOrFail($orderId);

        abort_if(
            $order->user_id !== $user->id
                && ! app(PermissionService::class)->userHasPermission($user, 'orders.manage'),
            Response::HTTP_FORBIDDEN,
        );

        return $order;
    }

    public function checkout(User $user, string $shippingAddress): Order
    {
        return DB::transaction(function () use ($user, $shippingAddress) {
            /** @var Cart|null $cart */
            $cart = $user->cart()
                ->lockForUpdate()
                ->with(['items' => fn ($query) => $query->lockForUpdate()->with('product')])
                ->first();

            abort_if(
                ! $cart || $cart->items->isEmpty(),
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'Your cart is empty.'
            );

            $total = 0.0;
            $lines = [];

            foreach ($cart->items as $item) {
                $inventory = $item->product->inventory()->lockForUpdate()->first();

                abort_if(
                    ! $inventory || $inventory->quantity < $item->quantity,
                    Response::HTTP_CONFLICT,
                    "Insufficient stock for '{$item->product->title}'."
                );

                $lineTotal = (float) $item->product->price * $item->quantity;
                $total += $lineTotal;

                $lines[] = [
                    'product' => $item->product,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->product->price,
                ];
            }

            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'pending',
                'total_amount' => $total,
                'shipping_address' => $shippingAddress,
            ]);

            foreach ($lines as $line) {
                $order->items()->create([
                    'order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'unit_price' => $line['unit_price'],
                    'quantity' => $line['quantity'],
                ]);

                $line['product']->inventory()->decrement('quantity', $line['quantity']);
            }

            $order->invoice()->create([
                'invoice_number' => 'INV-' . now()->format('Ymd') . '-' . strtoupper(Str::random(8)),
                'issued_at' => now(),
            ]);

            $this->invoices->generateFor($order);

            $cart->items()->delete();

            return $order->load(['items.product', 'invoice']);
        });
    }

    public function recordPayment(Order $order, string $provider, ?string $transactionId = null): Payment
    {
        return DB::transaction(function () use ($order, $provider, $transactionId) {
            abort_if(
                $order->status !== 'pending',
                Response::HTTP_CONFLICT,
                "Order is already '{$order->status}'."
            );

            $payment = $order->payments()->create([
                'provider' => $provider,
                'transaction_id' => $transactionId ?? (string) Str::uuid(),
                'amount' => $order->total_amount,
                'status' => 'paid',
                'raw_response' => null,
            ]);

            $order->update(['status' => 'paid']);

            return $payment;
        });
    }

    public function updateStatus(Order $order, string $status): Order
    {
        $order->update(['status' => $status]);

        return $order->refresh();
    }
}
