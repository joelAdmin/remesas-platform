<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExchangeCorridor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'origin_currency_id', 'destination_currency_id', 'name',
        'is_active', 'default_buy_rate', 'default_sell_rate', 'tasa_formula',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function originCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'origin_currency_id');
    }

    public function destinationCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'destination_currency_id');
    }

    public function commissionRules(): HasMany
    {
        return $this->hasMany(CommissionRule::class);
    }

    public function profitSharingRules(): HasMany
    {
        return $this->hasMany(ProfitSharingRule::class);
    }

    public function remittances(): HasMany
    {
        return $this->hasMany(Remittance::class);
    }
}
