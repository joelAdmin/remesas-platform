<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RemittanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'exchange_corridor_id' => $this->exchange_corridor_id,
            'client_account_id' => $this->client_account_id,
            'source_account_id' => $this->source_account_id,
            'ref_ve' => $this->ref_ve,
            'origin_amount' => $this->origin_amount,
            'buy_rate' => $this->buy_rate,
            'sell_rate' => $this->sell_rate,
            'origin_commission_percent' => $this->origin_commission_percent,
            'origin_commission_fixed' => $this->origin_commission_fixed,
            'origin_commission_total' => $this->origin_commission_total,
            'origin_net_amount' => $this->origin_net_amount,
            'usdt_bought' => $this->usdt_bought,
            'destination_commission_percent' => $this->destination_commission_percent,
            'destination_commission_fixed' => $this->destination_commission_fixed,
            'destination_commission_total' => $this->destination_commission_total,
            'destination_gross_amount' => $this->destination_gross_amount,
            'destination_net_amount' => $this->destination_net_amount,
            'usdt_to_sell' => $this->usdt_to_sell
                ? round((float) $this->usdt_to_sell, 2)
                : round((float) $this->destination_gross_amount / max((float) $this->sell_rate, 0.0001), 2),
            'profit_usdt' => $this->profit_usdt
                ? round((float) $this->profit_usdt, 2)
                : round((float) $this->usdt_bought - ((float) $this->destination_gross_amount / max((float) $this->sell_rate, 0.0001)), 2),
            'total_profit_usd' => $this->profit_usdt
                ? round((float) $this->total_profit_usd, 2)
                : round(
                    (float) $this->usdt_bought
                    - ((float) $this->destination_gross_amount / max((float) $this->sell_rate, 0.0001))
                    + ((float) $this->origin_commission_total / max((float) $this->buy_rate, 0.0001))
                    + ((float) $this->destination_commission_total / max((float) $this->sell_rate, 0.0001)),
                    2
                ),
            'work_cycle_id' => $this->work_cycle_id,
            'has_responsible_assignment' => $this->has_responsible_assignment,
            'total_assigned_percent' => $this->total_assigned_percent,
            'status' => $this->status,
            'process_steps' => $this->process_steps,
            'notes' => $this->notes,
            'origin_receipt' => $this->origin_receipt,
            'destination_receipt' => $this->destination_receipt,
            'origin_receipt_url' => $this->origin_receipt_url,
            'destination_receipt_url' => $this->destination_receipt_url,
            'client' => new ClientResource($this->whenLoaded('client')),
            'exchange_corridor' => new ExchangeCorridorResource($this->whenLoaded('exchangeCorridor')),
            'promoters' => RemittancePromoterResource::collection($this->whenLoaded('promoters')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
