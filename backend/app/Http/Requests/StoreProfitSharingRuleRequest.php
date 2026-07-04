<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProfitSharingRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exchange_corridor_id' => 'required|exists:exchange_corridors,id',
            'partner_name' => 'required|string|max:255',
            'percent' => 'required|numeric|min:0|max:100',
            'bonus_fixed' => 'nullable|numeric|min:0',
            'bonus_currency_id' => 'nullable|exists:currencies,id',
            'is_active' => 'boolean',
        ];
    }
}
