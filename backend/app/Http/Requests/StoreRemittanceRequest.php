<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRemittanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'work_cycle_id' => 'nullable|exists:work_cycles,id',
            'client_id' => 'required|exists:clients,id',
            'exchange_corridor_id' => 'required|exists:exchange_corridors,id',
            'origin_amount' => 'required|numeric|min:0',
            'buy_rate' => 'required|numeric|min:0',
            'sell_rate' => 'required|numeric|min:0',
            'tasa_publico' => 'required|numeric|min:0',
            'client_account_id' => 'nullable|exists:client_accounts,id',
            'source_account_id' => 'nullable|exists:source_accounts,id',
            'status' => 'nullable|string|max:50',
            'process_steps' => 'nullable|array',
            'notes' => 'nullable|string',
            'origin_receipt' => 'nullable|string',
            'destination_receipt' => 'nullable|string',
            'promoters' => 'nullable|array',
            'promoters.*.user_id' => 'required|exists:users,id',
            'promoters.*.profit_percent' => 'required|numeric|min:0|max:100',
        ];
    }
}
