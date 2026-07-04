<?php

namespace App\Contracts\Repositories;

use App\Models\WorkCycle;

interface WorkCycleRepositoryInterface extends BaseRepositoryInterface
{
    public function findOpen(): ?WorkCycle;

    public function hasOpen(): bool;
}
