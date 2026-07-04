<?php

namespace App\Contracts\Repositories;

use App\Models\Remittance;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface RemittanceRepositoryInterface extends BaseRepositoryInterface
{
    public function findByRef(string $ref): ?Remittance;
    public function findByClient(int $clientId): Collection;
    public function findByStatus(string $status): Collection;
    public function paginateWithFilters(array $filters, int $perPage): LengthAwarePaginator;
}
