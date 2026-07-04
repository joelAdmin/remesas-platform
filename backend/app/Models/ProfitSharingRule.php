<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfitSharingRule extends Model
{
    protected $fillable = [
        'exchange_corridor_id', 'partner_name', 'percent',
        'bonus_fixed', 'bonus_currency_id', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function exchangeCorridor(): BelongsTo
    {
        return $this->belongsTo(ExchangeCorridor::class);
    }

    public function bonusCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'bonus_currency_id');
    }
}
