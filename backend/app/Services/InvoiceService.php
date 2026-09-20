<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    private const DISK = 'local';

    public function generateFor(Order $order): Invoice
    {
        $order->loadMissing(['items.product', 'invoice', 'user']);

        $invoice = $order->invoice;

        abort_if(! $invoice, Response::HTTP_NOT_FOUND, 'No invoice for this order.');

        $options = new Options();
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

        return $invoice->refresh();
    }

    public function pathFor(string $invoiceNumber): string
    {
        return 'invoices/' . $invoiceNumber . '.pdf';
    }

    public function absolutePathFor(Invoice $invoice): string
    {
        return Storage::disk(self::DISK)->path($this->pathFor($invoice->invoice_number));
    }
}