<?php

namespace App\Repositories;

use App\Contracts\Repositories\WorkCycleRepositoryInterface;
use App\Models\WorkCycle;

class WorkCycleRepository extends BaseRepository implements WorkCycleRepositoryInterface
{
    public function __construct(WorkCycle $model)
    {
        parent::__construct($model);
    }

    public function findOpen(): ?WorkCycle
    {
        return $this->model->where('status', 'open')->first();
    }

    public function hasOpen(): bool
    {
        return $this->model->where('status', 'open')->exists();
    }
}
