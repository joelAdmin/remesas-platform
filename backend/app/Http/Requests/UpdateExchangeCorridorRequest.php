<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExchangeCorridorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'origin_currency_id' => 'sometimes|required|exists:currencies,id',
            'destination_currency_id' => 'sometimes|required|exists:currencies,id',
            'name' => 'sometimes|required|string|max:255',
            'is_active' => 'boolean',
            'default_buy_rate' => 'sometimes|required|numeric|min:0',
            'default_sell_rate' => 'sometimes|required|numeric|min:0',
        ];
    }
}
