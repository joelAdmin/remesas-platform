<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RemittancePromoter extends Model
{
    protected $fillable = ['remittance_id', 'user_id', 'profit_percent'];

    public function remittance(): BelongsTo
    {
        return $this->belongsTo(Remittance::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
