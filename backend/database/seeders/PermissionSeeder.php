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
            'invoices.manage',
            'users.manage',
            'roles.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(['name' => $permission]);
        }

        $rolePermissions = [
            'admin' => $permissions,
            'customer' => ['cart.manage', 'favorites.manage', 'orders.view-own'],
        ];

        foreach ($rolePermissions as $role => $names) {
            Role::where('name', $role)->first()?->permissions()->sync(
                Permission::whereIn('name', $names)->pluck('id')
            );
        }
    }
}
