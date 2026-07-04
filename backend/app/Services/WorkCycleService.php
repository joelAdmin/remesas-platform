<?php

namespace App\Services;

use App\Contracts\Repositories\WorkCycleRepositoryInterface;
use App\Models\WorkCycle;
use Illuminate\Support\Facades\DB;

class WorkCycleService
{
    public function __construct(
        private readonly WorkCycleRepositoryInterface $workCycleRepository,
    ) {}

    public function isEnabled(): bool
    {
        $value = DB::table('settings')->where('key', 'work_cycles_enabled')->value('value');
        return $value === '1';
    }

    public function getActiveCycle(): ?WorkCycle
    {
        return $this->workCycleRepository->findOpen();
    }
}
