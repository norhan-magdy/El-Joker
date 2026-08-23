<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Table('inventory')]
#[Fillable(['product_id', 'quantity'])]
class Inventory extends Model
{
    /** @use HasFactory<\Database\Factories\InventoryFactory> */
    use HasFactory;

    protected $primaryKey = 'product_id';

    public $incrementing = false;

    protected $keyType = 'string';

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
