<?php

namespace App\Repositories;

use App\Contracts\Repositories\PromoterCommissionRepositoryInterface;
use App\Models\PromoterCommission;

class PromoterCommissionRepository extends BaseRepository implements PromoterCommissionRepositoryInterface
{
    public function __construct(PromoterCommission $model)
    {
        parent::__construct($model);
    }
}
