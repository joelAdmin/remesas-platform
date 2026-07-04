<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('settings')->upsert([
            'key' => 'work_cycles_enabled',
            'value' => '0',
        ], 'key');
    }
}
