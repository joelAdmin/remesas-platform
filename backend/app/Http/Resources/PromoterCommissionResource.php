<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoterCommissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'promoter_goal_id' => $this->promoter_goal_id,
            'commission_rate_override' => $this->commission_rate_override,
            'valid_from' => $this->valid_from,
            'valid_until' => $this->valid_until,
            'promoter_goal' => new PromoterGoalResource($this->whenLoaded('promoterGoal')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
