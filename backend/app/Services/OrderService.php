<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Inventory;
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
                ! $user->hasPermissionTo('orders.manage'),
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
                && ! $user->hasPermissionTo('orders.manage'),
            Response::HTTP_FORBIDDEN,
        );

        return $order;
    }

    public function checkout(User $user, string $shippingAddress): Order
    {
        return DB::transaction(function () use ($user, $shippingAddress) {
            $cart = $user->cart()->first();

            abort_if(
                ! $cart || $cart->items()->doesntExist(),
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'Your cart is empty.'
            );

            $items = $cart->items()
                ->with(['product' => fn ($query) => $query->with('inventory')])
                ->get()
                ->keyBy(fn ($item) => $item->product_id);

            abort_if(
                $items->contains(fn ($item) => ! $item->product || ! $item->product->is_active),
                Response::HTTP_CONFLICT,
                'One or more products in your cart are no longer available.'
            );

            $productIds = $items->keys()->sort()->values()->all();
            $itemIds = $items->pluck('id')->all();

            Inventory::query()
                ->whereIn('product_id', $productIds)
                ->orderBy('product_id')
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            $cart = $user->cart()->lockForUpdate()->first();

            abort_if(! $cart, Response::HTTP_UNPROCESSABLE_ENTITY, 'Your cart is empty.');

            $cart->items()
                ->whereIn('id', $itemIds)
                ->orderBy('product_id')
                ->lockForUpdate()
                ->get();

            $items = $cart->items()
                ->whereIn('id', $itemIds)
                ->with(['product' => fn ($query) => $query->with('inventory')])
                ->get()
                ->keyBy('product_id');

            $total = 0.0;
            $lines = [];

            foreach ($items->values() as $item) {
                $inventory = $item->product->inventory;

                throw_if(
                    ! $inventory || $inventory->quantity < $item->quantity,
                    new InsufficientStockException(
                        $item->product_id,
                        (int) $item->quantity,
                        (int) ($inventory?->quantity ?? 0),
                        $item->product->title,
                    ),
                );

                $total += (float) $item->product->price * $item->quantity;

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

            $order->items()->insert(
                collect($lines)->map(fn (array $line) => [
                    'id' => (string) Str::uuid(),
                    'order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'unit_price' => $line['unit_price'],
                    'quantity' => $line['quantity'],
                ])->all(),
            );

            foreach ($lines as $line) {
                $affected = Inventory::query()
                    ->where('product_id', $line['product']->id)
                    ->where('quantity', '>=', $line['quantity'])
                    ->decrement('quantity', $line['quantity']);

                throw_if(
                    $affected !== 1,
                    new InsufficientStockException(
                        $line['product']->id,
                        (int) $line['quantity'],
                        0,
                        $line['product']->title,
                    ),
                );
            }

            $order->invoice()->create([
                'invoice_number' => 'INV-'.now()->format('Ymd').'-'.strtoupper(Str::random(8)),
                'issued_at' => now(),
            ]);

            $this->invoices->generateFor($order);

            $cart->items()->whereIn('id', $itemIds)->delete();

            return $order->load(['items.product', 'invoice']);
        }, 3);
    }

    public function recordPayment(Order $order, string $provider, ?string $transactionId = null): Payment
    {
        return DB::transaction(function () use ($order, $provider, $transactionId) {
            $locked = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            abort_if(
                $locked->status !== 'pending',
                Response::HTTP_CONFLICT,
                "Order is already '{$locked->status}'."
            );

            $payment = $locked->payments()->create([
                'provider' => $provider,
                'transaction_id' => $transactionId ?? (string) Str::uuid(),
                'amount' => $locked->total_amount,
                'status' => 'paid',
                'raw_response' => null,
            ]);

            $locked->update(['status' => 'paid']);

            $order->setRawAttributes($locked->getAttributes(), true);

            return $payment;
        }, 3);
    }

    public function updateStatus(Order $order, string $status): Order
    {
        return DB::transaction(function () use ($order, $status) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);

            $locked->update(['status' => $status]);

            $order->setRawAttributes($locked->getAttributes(), true);

            return $order->refresh();
        }, 3);
    }
}
