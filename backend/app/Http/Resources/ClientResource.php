<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'document_number' => $this->document_number,
            'phone' => $this->phone,
            'email' => $this->email,
            'country_id' => $this->country_id,
            'preferred_bank' => $this->preferred_bank,
            'address' => $this->address,
            'is_active' => $this->is_active,
            'country' => new CountryResource($this->whenLoaded('country')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
