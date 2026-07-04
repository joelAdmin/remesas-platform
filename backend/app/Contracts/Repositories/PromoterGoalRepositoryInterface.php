<?php

namespace App\Contracts\Repositories;

use App\Models\PromoterGoal;
use Illuminate\Database\Eloquent\Collection;

interface PromoterGoalRepositoryInterface extends BaseRepositoryInterface
{
    public function findByUserAndPeriod(int $userId, int $year, int $month): ?PromoterGoal;
    public function findByUser(int $userId): Collection;
    public function getPendingGoals(): Collection;
}
