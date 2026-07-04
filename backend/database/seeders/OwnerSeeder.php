<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class OwnerSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Owner',
            'email' => 'owner@sistemaremesas.com',
            'password' => bcrypt('password'),
            'role' => 'owner',
            'is_default_owner' => true,
        ]);
    }
}
