<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\InvoiceService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;

class GenerateInvoicePdf implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public int $timeout = 120;

    public int $uniqueFor = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(public readonly Order $order)
    {
        $this->onQueue((string) config('invoices.queue', 'invoices'));
    }

    /**
     * Get the middleware the job should run through.
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new WithoutOverlapping($this->order->id))->expireAfter(300)];
    }

    /**
     * Get the unique ID for the job.
     */
    public function uniqueId(): string
    {
        return (string) $this->order->id;
    }

    /**
     * Execute the job.
     */
    public function handle(InvoiceService $invoices): void
    {
        $invoices->renderFor($this->order);
    }
}
