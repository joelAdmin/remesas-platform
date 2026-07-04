<?php

namespace App\Contracts\Repositories;

use App\Models\Currency;
use Illuminate\Database\Eloquent\Collection;

interface CurrencyRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCode(string $code): ?Currency;
    public function getFiat(): Collection;
    public function getCrypto(): Collection;
}
