<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalculateRemittanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'origin_amount' => 'required|numeric|min:0',
            'buy_rate' => 'required|numeric|min:0',
            'sell_rate' => 'required|numeric|min:0',
            'exchange_corridor_id' => 'required|exists:exchange_corridors,id',
            'tasa_publico' => 'required|numeric|min:0',
        ];
    }
}
