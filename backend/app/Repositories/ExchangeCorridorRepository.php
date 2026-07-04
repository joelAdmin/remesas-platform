<?php

namespace App\Repositories;

use App\Contracts\Repositories\ExchangeCorridorRepositoryInterface;
use App\Models\ExchangeCorridor;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ExchangeCorridorRepository extends BaseRepository implements ExchangeCorridorRepositoryInterface
{
    public function __construct(ExchangeCorridor $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        return $this->model->with(['originCurrency', 'destinationCurrency'])->get();
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->with(['originCurrency', 'destinationCurrency'])->paginate($perPage);
    }

    public function findByCurrencies(int $originId, int $destinationId): ?ExchangeCorridor
    {
        return $this->model->where('origin_currency_id', $originId)
            ->where('destination_currency_id', $destinationId)
            ->first();
    }

    public function getActive(): Collection
    {
        return $this->model->with(['originCurrency', 'destinationCurrency'])->where('is_active', true)->get();
    }
}
