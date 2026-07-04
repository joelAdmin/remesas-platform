<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Currency extends Model
{
    use SoftDeletes;

    protected $fillable = ['code', 'name', 'symbol', 'decimals', 'is_crypto'];

    protected function casts(): array
    {
        return ['is_crypto' => 'boolean'];
    }

    public function originCorridors(): HasMany
    {
        return $this->hasMany(ExchangeCorridor::class, 'origin_currency_id');
    }

    public function destinationCorridors(): HasMany
    {
        return $this->hasMany(ExchangeCorridor::class, 'destination_currency_id');
    }
}
