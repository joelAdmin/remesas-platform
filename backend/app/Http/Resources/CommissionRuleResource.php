<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommissionRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exchange_corridor_id' => $this->exchange_corridor_id,
            'commission_type' => $this->commission_type,
            'percent' => $this->percent,
            'fixed_amount' => $this->fixed_amount,
            'fixed_currency_id' => $this->fixed_currency_id,
            'applies_to' => $this->applies_to,
            'is_active' => $this->is_active,
            'exchange_corridor' => new ExchangeCorridorResource($this->whenLoaded('exchangeCorridor')),
            'fixed_currency' => new CurrencyResource($this->whenLoaded('fixedCurrency')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
