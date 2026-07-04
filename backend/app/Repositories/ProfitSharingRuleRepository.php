<?php

namespace App\Repositories;

use App\Contracts\Repositories\ProfitSharingRuleRepositoryInterface;
use App\Models\ProfitSharingRule;
use Illuminate\Database\Eloquent\Collection;

class ProfitSharingRuleRepository extends BaseRepository implements ProfitSharingRuleRepositoryInterface
{
    public function __construct(ProfitSharingRule $model)
    {
        parent::__construct($model);
    }

    public function findByCorridor(int $corridorId): Collection
    {
        return $this->model->where('exchange_corridor_id', $corridorId)
            ->where('is_active', true)
            ->get();
    }
}
