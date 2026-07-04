<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'currency_code' => 'sometimes|required|string|max:10',
            'currency_symbol' => 'sometimes|required|string|max:10',
            'phone_code' => 'sometimes|required|string|max:10',
            'flag_icon' => 'nullable|string|max:255',
        ];
    }
}
