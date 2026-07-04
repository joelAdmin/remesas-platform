<?php

namespace App\Repositories;

use App\Contracts\Repositories\CurrencyRepositoryInterface;
use App\Models\Currency;
use Illuminate\Database\Eloquent\Collection;

class CurrencyRepository extends BaseRepository implements CurrencyRepositoryInterface
{
    public function __construct(Currency $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code): ?Currency
    {
        return $this->model->where('code', strtoupper($code))->first();
    }

    public function getFiat(): Collection
    {
        return $this->model->where('is_crypto', false)->get();
    }

    public function getCrypto(): Collection
    {
        return $this->model->where('is_crypto', true)->get();
    }
}
