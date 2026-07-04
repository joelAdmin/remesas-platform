<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromoterCommission extends Model
{
    protected $fillable = ['promoter_goal_id', 'commission_rate_override', 'valid_from', 'valid_until'];

    protected function casts(): array
    {
        return [
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }

    public function promoterGoal(): BelongsTo
    {
        return $this->belongsTo(PromoterGoal::class);
    }
}
