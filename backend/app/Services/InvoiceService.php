<?php

namespace App\Services;

use App\Jobs\GenerateInvoicePdf;
use App\Models\Invoice;
use App\Models\Order;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    private const DISK = 'local';

    public function listForAdmin(?string $search = null): LengthAwarePaginator
    {
        return Invoice::query()
            ->with(['order.user', 'order.items.product'])
            ->when($search, fn ($query) => $query->where(fn ($q) => $q
                ->where('invoice_number', 'ilike', "%{$search}%")
                ->orWhereHas('order', fn ($oq) => $oq
                    ->where('id', 'ilike', "%{$search}%")
                    ->orWhereHas('user', fn ($uq) => $uq
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")))))
            ->latest('issued_at')
            ->paginate(15);
    }

    public function regenerate(Invoice $invoice): void
    {
        GenerateInvoicePdf::dispatch($invoice->order);
    }

    public function generateFor(Order $order): void
    {
        GenerateInvoicePdf::dispatch($order)->afterCommit();
    }

    public function renderFor(Order $order): void
    {
        $order->loadMissing(['items.product', 'invoice', 'user']);

        $invoice = $order->invoice;

        abort_if(! $invoice, Response::HTTP_NOT_FOUND, 'No invoice for this order.');

        $options = new Options;
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml(view('invoices.invoice', [
            'order' => $order,
            'invoice' => $invoice,
        ])->render());
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        Storage::disk(self::DISK)->put(
            self::pathFor($invoice->invoice_number),
            $dompdf->output(),
        );

        $invoice->forceFill([
            'pdf_url' => route('orders.invoice-pdf', $order),
        ])->save();
    }

    public function pathFor(string $invoiceNumber): string
    {
        return 'invoices/'.$invoiceNumber.'.pdf';
    }

    public function absolutePathFor(Invoice $invoice): string
    {
        return Storage::disk(self::DISK)->path($this->pathFor($invoice->invoice_number));
    }
}
