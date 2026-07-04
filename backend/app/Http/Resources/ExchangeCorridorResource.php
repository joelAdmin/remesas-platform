<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeCorridorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'origin_currency_id' => $this->origin_currency_id,
            'destination_currency_id' => $this->destination_currency_id,
            'name' => $this->name,
            'is_active' => $this->is_active,
            'tasa_formula' => $this->tasa_formula ?? 'divide',
            'default_buy_rate' => $this->default_buy_rate,
            'default_sell_rate' => $this->default_sell_rate,
            'origin_currency' => new CurrencyResource($this->whenLoaded('originCurrency')),
            'destination_currency' => new CurrencyResource($this->whenLoaded('destinationCurrency')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
