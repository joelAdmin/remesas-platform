<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePromoterGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'goal_amount_usd' => 'required|numeric|min:0',
            'achieved_amount_usd' => 'nullable|numeric|min:0',
            'bonus_percent' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|string|max:50',
        ];
    }
}
