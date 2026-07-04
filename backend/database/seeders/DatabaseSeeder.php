<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OwnerSeeder::class,
            CountrySeeder::class,
            CurrencySeeder::class,
            ExchangeCorridorSeeder::class,
            PermissionSeeder::class,
            SettingsSeeder::class,
        ]);
    }
}
