<?php

namespace App\Repositories;

use App\Contracts\Repositories\PromoterGoalRepositoryInterface;
use App\Models\PromoterGoal;
use Illuminate\Database\Eloquent\Collection;

class PromoterGoalRepository extends BaseRepository implements PromoterGoalRepositoryInterface
{
    public function __construct(PromoterGoal $model)
    {
        parent::__construct($model);
    }

    public function findByUserAndPeriod(int $userId, int $year, int $month): ?PromoterGoal
    {
        return $this->model->where('user_id', $userId)
            ->where('year', $year)
            ->where('month', $month)
            ->first();
    }

    public function findByUser(int $userId): Collection
    {
        return $this->model->where('user_id', $userId)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();
    }

    public function getPendingGoals(): Collection
    {
        return $this->model->where('status', 'pending')->get();
    }
}
