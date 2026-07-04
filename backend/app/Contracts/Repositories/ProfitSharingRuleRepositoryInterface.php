<?php

namespace App\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;

interface ProfitSharingRuleRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCorridor(int $corridorId): Collection;
}
