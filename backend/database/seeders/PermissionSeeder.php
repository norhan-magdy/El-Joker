<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'categories.manage',
            'products.view',
            'products.manage',
            'inventory.manage',
            'cart.manage',
            'favorites.manage',
            'orders.view-own',
            'orders.manage',
            'payments.process',
            'users.manage',
            'roles.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(['name' => $permission]);
        }

        Role::where('name', 'admin')->first()?->permissions()->sync(
            Permission::pluck('id')
        );
    }
}
