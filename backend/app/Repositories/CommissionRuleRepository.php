<?php

namespace App\Repositories;

use App\Contracts\Repositories\CommissionRuleRepositoryInterface;
use App\Models\CommissionRule;
use Illuminate\Database\Eloquent\Collection;

class CommissionRuleRepository extends BaseRepository implements CommissionRuleRepositoryInterface
{
    public function __construct(CommissionRule $model)
    {
        parent::__construct($model);
    }

    public function findByCorridor(int $corridorId): Collection
    {
        return $this->model->where('exchange_corridor_id', $corridorId)->get();
    }

    public function findActiveByCorridor(int $corridorId): Collection
    {
        return $this->model->where('exchange_corridor_id', $corridorId)
            ->where('is_active', true)
            ->get();
    }

    public function findByCorridorAndType(int $corridorId, string $type): ?CommissionRule
    {
        return $this->model->where('exchange_corridor_id', $corridorId)
            ->where('commission_type', $type)
            ->first();
    }
}
