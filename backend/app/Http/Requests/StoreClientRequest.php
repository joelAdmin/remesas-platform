<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:255',
            'document_number' => 'required|string|max:50|unique:clients,document_number',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'country_id' => 'required|exists:countries,id',
            'preferred_bank' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ];
    }
}
