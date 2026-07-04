<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'currency_code' => 'required|string|max:10',
            'currency_symbol' => 'required|string|max:10',
            'phone_code' => 'required|string|max:10',
            'flag_icon' => 'nullable|string|max:255',
        ];
    }
}
