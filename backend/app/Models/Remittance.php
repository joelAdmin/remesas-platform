<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Remittance extends Model
{
    protected $fillable = [
        'client_id', 'exchange_corridor_id', 'client_account_id', 'source_account_id', 'ref_ve',
        'origin_amount', 'buy_rate', 'sell_rate',
        'origin_commission_percent', 'origin_commission_fixed', 'origin_commission_total',
        'origin_net_amount', 'usdt_bought',
        'destination_commission_percent', 'destination_commission_fixed', 'destination_commission_total',
        'destination_gross_amount', 'destination_net_amount',
        'usdt_to_sell', 'profit_usdt',
        'total_profit_usd', 'has_responsible_assignment', 'total_assigned_percent', 'work_cycle_id',
        'status', 'process_steps', 'notes',
        'registered_at',
        'origin_receipt', 'destination_receipt',
    ];

    protected function casts(): array
    {
        return [
            'has_responsible_assignment' => 'boolean',
            'process_steps' => 'array',
            'registered_at' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function exchangeCorridor(): BelongsTo
    {
        return $this->belongsTo(ExchangeCorridor::class);
    }

    public function clientAccount(): BelongsTo
    {
        return $this->belongsTo(ClientAccount::class);
    }

    public function sourceAccount(): BelongsTo
    {
        return $this->belongsTo(SourceAccount::class);
    }

    public function responsibles(): HasMany
    {
        return $this->hasMany(RemittanceResponsible::class);
    }

    public function promoters(): HasMany
    {
        return $this->hasMany(RemittancePromoter::class);
    }

    public function workCycle(): BelongsTo
    {
        return $this->belongsTo(WorkCycle::class);
    }

    public function getOriginReceiptUrlAttribute(): ?string
    {
        return $this->origin_receipt;
    }

    public function getDestinationReceiptUrlAttribute(): ?string
    {
        return $this->destination_receipt;
    }
}
