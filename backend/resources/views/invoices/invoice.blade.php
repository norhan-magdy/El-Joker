<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 13px;
            color: #1f2937;
            line-height: 1.5;
        }
        .invoice { padding: 36px 40px; }
        .header { display: table; width: 100%; border-bottom: 2px solid #111827; padding-bottom: 18px; }
        .brand { display: table-cell; vertical-align: middle; }
        .brand-name { font-size: 24px; font-weight: bold; letter-spacing: 0.5px; color: #111827; }
        .brand-tagline { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .title { display: table-cell; vertical-align: middle; text-align: right; }
        .title h1 { font-size: 26px; font-weight: bold; letter-spacing: 2px; color: #374151; text-transform: uppercase; }
        .meta { display: table; width: 100%; margin-top: 22px; }
        .meta-cell { display: table-cell; vertical-align: top; padding-right: 24px; }
        .meta-cell.right { text-align: right; padding-right: 0; }
        .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 4px; }
        .value { font-size: 13px; color: #111827; margin-bottom: 10px; }
        .value strong { font-weight: bold; }
        .section { margin-top: 26px; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 8px; }
        table.items th {
            text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
            color: #6b7280; border-bottom: 1px solid #d1d5db; padding: 8px 6px;
        }
        table.items th.num, table.items td.num { text-align: right; }
        table.items td {
            border-bottom: 1px solid #e5e7eb; padding: 10px 6px; vertical-align: top;
        }
        table.items tr:last-child td { border-bottom: none; }
        .product-title { font-weight: bold; color: #111827; }
        .product-meta { font-size: 11px; color: #6b7280; }
        .total-wrap { float: right; width: 240px; margin-top: 22px; }
        .total-row { display: table; width: 100%; padding: 4px 0; }
        .total-row .k { display: table-cell; font-size: 12px; color: #6b7280; }
        .total-row .v { display: table-cell; text-align: right; font-size: 13px; color: #111827; }
        .total-row.grand { border-top: 2px solid #111827; margin-top: 4px; padding-top: 8px; }
        .total-row.grand .k { font-weight: bold; color: #111827; font-size: 13px; }
        .total-row.grand .v { font-weight: bold; font-size: 16px; }
        .status { margin-top: 34px; float: right; text-align: right; }
        .status .pill {
            display: inline-block; font-size: 11px; font-weight: bold; text-transform: uppercase;
            letter-spacing: 1px; padding: 4px 12px; border-radius: 3px;
        }
        .status .pill.paid { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .status .pill.default { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
        .footer {
            position: fixed; bottom: 0; left: 0; right: 0;
            border-top: 1px solid #e5e7eb; padding: 12px 40px;
            font-size: 10px; color: #9ca3af;
        }
        .clearfix:after { content: ""; display: table; clear: both; }
    </style>
</head>
<body>
    @php
        $money = fn (mixed $value): string => '$' . number_format((float) $value, 2, '.', ',');
    @endphp
    <div class="invoice">
        <div class="header">
            <div class="brand">
                <div class="brand-name">{{ config('app.name') }}</div>
                <div class="brand-tagline">Customer invoice</div>
            </div>
            <div class="title">
                <h1>Invoice</h1>
            </div>
        </div>

        <div class="meta">
            <div class="meta-cell">
                <div class="label">Bill to</div>
                <div class="value"><strong>{{ $order->user?->name }}</strong></div>
                <div class="value">{{ $order->user?->email }}</div>

                <div class="label" style="margin-top: 12px;">Invoice no.</div>
                <div class="value">{{ $invoice->invoice_number }}</div>

                <div class="label">Issued</div>
                <div class="value">{{ $invoice->issued_at?->format('M d, Y') }}</div>
            </div>
            <div class="meta-cell right">
                <div class="label">Order</div>
                <div class="value"><strong>#{{ $order->id }}</strong></div>

                <div class="label" style="margin-top: 12px;">Placed</div>
                <div class="value">{{ $order->created_at?->format('M d, Y') }}</div>

                <div class="label">Status</div>
                <div class="value">{{ ucfirst($order->status) }}</div>
            </div>
        </div>

        <div class="section">
            <div class="label">Shipping address</div>
            <div class="value" style="white-space: pre-wrap;">{{ $order->shipping_address }}</div>
        </div>

        <div class="section">
            <div class="label">Items</div>
            <table class="items">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th class="num">Qty</th>
                        <th class="num">Unit price</th>
                        <th class="num">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($order->items as $item)
                        <tr>
                            <td>
                                <div class="product-title">{{ $item->product?->title }}</div>
                                @if ($item->product?->slug)
                                    <div class="product-meta">{{ $item->product->slug }}</div>
                                @endif
                            </td>
                            <td class="num">{{ $item->quantity }}</td>
                            <td class="num">{{ $money($item->unit_price) }}</td>
                            <td class="num">{{ $money((float) $item->unit_price * $item->quantity) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="clearfix">
            <div class="total-wrap">
                <div class="total-row">
                    <span class="k">Subtotal</span>
                    <span class="v">{{ $money($order->total_amount) }}</span>
                </div>
                <div class="total-row">
                    <span class="k">Shipping</span>
                    <span class="v">$0.00</span>
                </div>
                <div class="total-row grand">
                    <span class="k">Total</span>
                    <span class="v">{{ $money($order->total_amount) }}</span>
                </div>
            </div>
            <div class="status">
                @if ($order->status === 'paid')
                    <span class="pill paid">Paid</span>
                @else
                    <span class="pill default">{{ ucfirst($order->status) }}</span>
                @endif
            </div>
        </div>
    </div>

    <div class="footer">
        {{ config('app.name') }} · Invoice {{ $invoice->invoice_number }} · Generated {{ now()->format('M d, Y H:i') }}
    </div>
</body>
</html>