<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommissionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exchange_corridor_id' => 'required|exists:exchange_corridors,id',
            'commission_type' => 'required|string|max:50',
            'percent' => 'nullable|numeric|min:0',
            'fixed_amount' => 'nullable|numeric|min:0',
            'fixed_currency_id' => 'nullable|exists:currencies,id',
            'applies_to' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ];
    }
}
