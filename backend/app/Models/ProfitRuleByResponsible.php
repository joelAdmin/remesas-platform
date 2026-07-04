<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfitRuleByResponsible extends Model
{
    protected $table = 'profit_rules_by_responsible';

    protected $fillable = ['user_id', 'exchange_corridor_id', 'default_percent', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exchangeCorridor(): BelongsTo
    {
        return $this->belongsTo(ExchangeCorridor::class);
    }
}
