<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\ExchangeCorridor;
use Illuminate\Database\Seeder;

class ExchangeCorridorSeeder extends Seeder
{
    public function run(): void
    {
        $cop = Currency::where('code', 'COP')->first()->id;
        $ves = Currency::where('code', 'VES')->first()->id;
        $clp = Currency::where('code', 'CLP')->first()->id;

        $corridors = [
            [
                'origin_currency_id' => $cop,
                'destination_currency_id' => $ves,
                'name' => 'COP → VES',
                'default_buy_rate' => 4000.0000,
                'default_sell_rate' => 45.0000,
                'is_active' => true,
                'tasa_formula' => 'divide',
            ],
            [
                'origin_currency_id' => $clp,
                'destination_currency_id' => $ves,
                'name' => 'CLP → VES',
                'default_buy_rate' => 900.0000,
                'default_sell_rate' => 45.0000,
                'is_active' => true,
                'tasa_formula' => 'divide',
            ],
            [
                'origin_currency_id' => $ves,
                'destination_currency_id' => $cop,
                'name' => 'VES → COP',
                'default_buy_rate' => 45.0000,
                'default_sell_rate' => 4000.0000,
                'is_active' => true,
                'tasa_formula' => 'multiply',
            ],
        ];

        foreach ($corridors as $corridor) {
            ExchangeCorridor::create($corridor);
        }
    }
}
