<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        Country::insert([
            ['name' => 'Colombia', 'currency_code' => 'COP', 'currency_symbol' => '$', 'phone_code' => '+57', 'flag_icon' => '🇨🇴'],
            ['name' => 'Venezuela', 'currency_code' => 'VES', 'currency_symbol' => 'Bs.', 'phone_code' => '+58', 'flag_icon' => '🇻🇪'],
            ['name' => 'Chile', 'currency_code' => 'CLP', 'currency_symbol' => '$', 'phone_code' => '+56', 'flag_icon' => '🇨🇱'],
        ]);
    }
}
