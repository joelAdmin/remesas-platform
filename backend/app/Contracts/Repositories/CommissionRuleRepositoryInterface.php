<?php

namespace App\Contracts\Repositories;

use App\Models\CommissionRule;
use Illuminate\Database\Eloquent\Collection;

interface CommissionRuleRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCorridor(int $corridorId): Collection;
    public function findActiveByCorridor(int $corridorId): Collection;
    public function findByCorridorAndType(int $corridorId, string $type): ?CommissionRule;
}
