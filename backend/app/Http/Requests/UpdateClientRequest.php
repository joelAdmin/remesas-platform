<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => 'sometimes|required|string|max:255',
            'document_number' => 'sometimes|required|string|max:50|unique:clients,document_number,' . $this->route('client'),
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'country_id' => 'sometimes|required|exists:countries,id',
            'preferred_bank' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ];
    }
}
