<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfitSharingRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exchange_corridor_id' => $this->exchange_corridor_id,
            'partner_name' => $this->partner_name,
            'percent' => $this->percent,
            'bonus_fixed' => $this->bonus_fixed,
            'bonus_currency_id' => $this->bonus_currency_id,
            'is_active' => $this->is_active,
            'exchange_corridor' => new ExchangeCorridorResource($this->whenLoaded('exchangeCorridor')),
            'bonus_currency' => new CurrencyResource($this->whenLoaded('bonusCurrency')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
