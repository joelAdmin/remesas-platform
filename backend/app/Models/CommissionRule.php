<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionRule extends Model
{
    protected $fillable = [
        'exchange_corridor_id', 'commission_type', 'percent',
        'fixed_amount', 'fixed_currency_id', 'applies_to', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function exchangeCorridor(): BelongsTo
    {
        return $this->belongsTo(ExchangeCorridor::class);
    }

    public function fixedCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'fixed_currency_id');
    }
}
