<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCurrencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => 'sometimes|required|string|max:10|unique:currencies,code,' . $this->route('currency'),
            'name' => 'sometimes|required|string|max:255',
            'symbol' => 'sometimes|required|string|max:10',
            'decimals' => 'sometimes|required|integer|min:0|max:8',
            'is_crypto' => 'boolean',
        ];
    }
}
