<?php

namespace App\Contracts\Repositories;

use App\Models\ExchangeCorridor;
use Illuminate\Database\Eloquent\Collection;

interface ExchangeCorridorRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCurrencies(int $originId, int $destinationId): ?ExchangeCorridor;
    public function getActive(): Collection;
}
