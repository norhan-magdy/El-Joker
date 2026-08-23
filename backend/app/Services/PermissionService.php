<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

class PermissionService
{
    public function userHasPermission(User $user, string $permission): bool
    {
        return $user->roles()
            ->whereHas('permissions', fn ($query) => $query->where('name', $permission))
            ->exists();
    }

    public function userHasAnyPermission(User $user, array $permissions): bool
    {
        return $user->roles()
            ->whereHas('permissions', fn ($query) => $query->whereIn('name', $permissions))
            ->exists();
    }

    public function userHasRole(User $user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    public function assignRole(User $user, string $role): void
    {
        $role = Role::where('name', $role)->firstOrFail();

        $user->roles()->syncWithoutDetaching([$role->id]);
    }

    public function removeRole(User $user, string $role): void
    {
        $role = Role::where('name', $role)->firstOrFail();

        $user->roles()->detach($role->id);
    }

    public function syncUserRoles(User $user, array $roles): void
    {
        $roleIds = Role::whereIn('name', $roles)->pluck('id');

        if ($roleIds->count() !== count($roles)) {
            abort(422, 'One or more roles do not exist.');
        }

        $user->roles()->sync($roleIds);
    }

    public function givePermissionTo(Role $role, string|array $permissions): void
    {
        $ids = collect((array) $permissions)
            ->map(fn (string $name) => Permission::where('name', $name)->value('id'))
            ->filter()
            ->all();

        $role->permissions()->syncWithoutDetaching($ids);
    }

    public function revokePermissionFrom(Role $role, string|array $permissions): void
    {
        $permissionIds = Permission::whereIn('name', (array) $permissions)->pluck('id');

        $role->permissions()->detach($permissionIds);
    }
}
