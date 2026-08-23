<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['admin', 'customer'] as $role) {
            \App\Models\Role::updateOrCreate(['name' => $role]);
        }
    }
}
