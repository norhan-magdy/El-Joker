<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@commerce.test'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $admin->roles()->syncWithoutDetaching(
            [\App\Models\Role::where('name', 'admin')->value('id')]
        );

        $customer = User::updateOrCreate(
            ['email' => 'customer@commerce.test'],
            [
                'name' => 'Customer User',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $customer->roles()->syncWithoutDetaching(
            [\App\Models\Role::where('name', 'customer')->value('id')]
        );
    }
}
