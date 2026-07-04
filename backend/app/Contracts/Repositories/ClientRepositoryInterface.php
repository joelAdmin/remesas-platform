<?php

namespace App\Contracts\Repositories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ClientRepositoryInterface extends BaseRepositoryInterface
{
    public function search(string $query): Collection;
    public function findByDocument(string $document, int $countryId): ?Client;
    public function paginateWithFilters(array $filters, int $perPage): LengthAwarePaginator;
}
