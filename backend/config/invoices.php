<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Invoice Storage Disk
    |--------------------------------------------------------------------------
    |
    | Disk used to persist generated invoice PDFs. Point it at object storage
    | (s3, gcs) when the application runs on more than one node, otherwise the
    | PDF would only exist on the node that generated it.
    |
    */

    'disk' => env('INVOICE_DISK', env('FILESYSTEM_DISK', 'local')),

    /*
    |--------------------------------------------------------------------------
    | Invoice Queue
    |--------------------------------------------------------------------------
    |
    | Dedicated queue for the CPU heavy PDF rendering jobs so it can be scaled
    | (and monitored) separately from the rest of the application.
    |
    */

    'queue' => env('INVOICE_QUEUE', 'invoices'),

    /*
    |--------------------------------------------------------------------------
    | Signed URL Lifetime
    |--------------------------------------------------------------------------
    |
    | Minutes a temporary invoice URL stays valid.
    |
    */

    'signed_url_minutes' => (int) env('INVOICE_SIGNED_URL_MINUTES', 10),

];
