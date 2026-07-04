<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RemittanceResponsible extends Model
{
    protected $fillable = ['remittance_id', 'user_id', 'assigned_percent', 'profit_usd'];

    public function remittance(): BelongsTo
    {
        return $this->belongsTo(Remittance::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
