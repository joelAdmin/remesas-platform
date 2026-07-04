<?php

namespace App\Contracts\Repositories;

use App\Models\Country;
use Illuminate\Database\Eloquent\Collection;

interface CountryRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCurrencyCode(string $code): ?Country;
    public function search(string $query): Collection;
}
