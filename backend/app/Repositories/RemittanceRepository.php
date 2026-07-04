<?php

namespace App\Repositories;

use App\Contracts\Repositories\RemittanceRepositoryInterface;
use App\Models\Remittance;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class RemittanceRepository extends BaseRepository implements RemittanceRepositoryInterface
{
    public function __construct(Remittance $model)
    {
        parent::__construct($model);
    }

    public function findByRef(string $ref): ?Remittance
    {
        return $this->model->where('ref_ve', $ref)->first();
    }

    public function findByClient(int $clientId): Collection
    {
        return $this->model->where('client_id', $clientId)->get();
    }

    public function findByStatus(string $status): Collection
    {
        return $this->model->where('status', $status)->get();
    }

    public function paginateWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->with(['client', 'exchangeCorridor.originCurrency', 'exchangeCorridor.destinationCurrency']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['client_id'])) {
            $query->where('client_id', $filters['client_id']);
        }

        if (!empty($filters['corridor_id'])) {
            $query->where('exchange_corridor_id', $filters['corridor_id']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('registered_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('registered_at', '<=', $filters['date_to']);
        }

        return $query->latest()->paginate($perPage);
    }
}
