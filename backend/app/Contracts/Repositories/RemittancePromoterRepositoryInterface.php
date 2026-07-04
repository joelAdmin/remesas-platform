<?php

namespace App\Contracts\Repositories;

use App\Models\RemittancePromoter;
use Illuminate\Database\Eloquent\Collection;

interface RemittancePromoterRepositoryInterface extends BaseRepositoryInterface
{
    public function findByRemittance(int $remittanceId): Collection;
    public function findByUser(int $userId): Collection;
    public function syncForRemittance(int $remittanceId, array $promoters): void;
}
