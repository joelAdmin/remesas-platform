<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RemittancePromoterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'remittance_id' => $this->remittance_id,
            'user_id' => $this->user_id,
            'profit_percent' => $this->profit_percent,
            'user' => $this->whenLoaded('user', fn() => $this->user ? new UserResource($this->user) : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
