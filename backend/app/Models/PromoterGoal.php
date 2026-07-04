<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoterGoal extends Model
{
    protected $fillable = [
        'user_id', 'year', 'month', 'goal_amount_usd',
        'achieved_amount_usd', 'bonus_percent', 'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(PromoterCommission::class);
    }
}
