<?php

namespace App\Services;

use App\Models\Remittance;
use Illuminate\Support\Facades\DB;

class RefGeneratorService
{
    public function generate(): string
    {
        $date = now()->format('Ymd');

        $lastRef = Remittance::where('ref_ve', 'like', "RE-{$date}-%")
            ->lockForUpdate()
            ->orderBy('id', 'desc')
            ->value('ref_ve');

        $sequence = $lastRef ? (int) substr($lastRef, -4) + 1 : 1;

        return sprintf('RE-%s-%04d', $date, $sequence);
    }
}
