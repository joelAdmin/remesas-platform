<?php

namespace App\Repositories;

use App\Contracts\Repositories\RemittancePromoterRepositoryInterface;
use App\Models\RemittancePromoter;
use Illuminate\Database\Eloquent\Collection;

class RemittancePromoterRepository extends BaseRepository implements RemittancePromoterRepositoryInterface
{
    public function __construct(RemittancePromoter $model)
    {
        parent::__construct($model);
    }

    public function findByRemittance(int $remittanceId): Collection
    {
        return $this->model->where('remittance_id', $remittanceId)->with('user')->get();
    }

    public function findByUser(int $userId): Collection
    {
        return $this->model->where('user_id', $userId)->with('remittance')->get();
    }

    public function syncForRemittance(int $remittanceId, array $promoters): void
    {
        $this->model->where('remittance_id', $remittanceId)->delete();

        foreach ($promoters as $promoter) {
            $this->model->create([
                'remittance_id' => $remittanceId,
                'user_id' => $promoter['user_id'],
                'profit_percent' => $promoter['profit_percent'],
            ]);
        }
    }
}
