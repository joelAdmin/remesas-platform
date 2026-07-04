<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        Currency::insert([
            ['code' => 'COP', 'name' => 'Peso Colombiano', 'symbol' => '$', 'decimals' => 2, 'is_crypto' => false],
            ['code' => 'VES', 'name' => 'Bolívar Venezolano', 'symbol' => 'Bs.', 'decimals' => 2, 'is_crypto' => false],
            ['code' => 'CLP', 'name' => 'Peso Chileno', 'symbol' => '$', 'decimals' => 2, 'is_crypto' => false],
            ['code' => 'USDT', 'name' => 'Tether USD', 'symbol' => 'USDT', 'decimals' => 2, 'is_crypto' => true],
        ]);
    }
}
