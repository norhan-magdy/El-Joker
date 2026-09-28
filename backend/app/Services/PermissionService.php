<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    private const VERSION_KEY = 'rbac:version';

    private const TTL_SECONDS = 3600;

    public function userHasPermission(User $user, string $permission): bool
    {
        return in_array($permission, $this->permissionsFor($user), true);
    }

    public function userHasAnyPermission(User $user, array $permissions): bool
    {
        return array_intersect($this->permissionsFor($user), $permissions) !== [];
    }

    public function userHasRole(User $user, string $role): bool
    {
        return in_array($role, $this->rolesFor($user), true);
    }

    /**
     * @return array<int, string>
     */
    public function permissionsFor(User $user): array
    {
        return Cache::remember(
            $this->key("user:{$user->id}:permissions"),
            self::TTL_SECONDS,
            fn () => $user->roles()
                ->with('permissions:id,name')
                ->get()
                ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
                ->unique()
                ->values()
                ->all()
        );
    }

    /**
     * @return array<int, string>
     */
    public function rolesFor(User $user): array
    {
        return Cache::remember(
            $this->key("user:{$user->id}:roles"),
            self::TTL_SECONDS,
            fn () => $user->roles()->pluck('name')->all()
        );
    }

    public function assignRole(User $user, string $role): void
    {
        $role = Role::where('name', $role)->firstOrFail();

        $user->roles()->syncWithoutDetaching([$role->id]);

        $user->syncAdminFlag();

        $this->flushCache();
    }

    public function removeRole(User $user, string $role): void
    {
        $role = Role::where('name', $role)->firstOrFail();

        $user->roles()->detach($role->id);

        $user->syncAdminFlag();

        $this->flushCache();
    }

    public function syncUserRoles(User $user, array $roles): void
    {
        $roleIds = Role::whereIn('name', $roles)->pluck('id');

        if ($roleIds->count() !== count($roles)) {
            abort(422, 'One or more roles do not exist.');
        }

        $user->roles()->sync($roleIds);

        $user->syncAdminFlag();

        $this->flushCache();
    }

    public function givePermissionTo(Role $role, string|array $permissions): void
    {
        $ids = Permission::whereIn('name', (array) $permissions)->pluck('id')->all();

        $role->permissions()->syncWithoutDetaching($ids);

        $this->flushCache();
    }

    public function revokePermissionFrom(Role $role, string|array $permissions): void
    {
        $permissionIds = Permission::whereIn('name', (array) $permissions)->pluck('id');

        $role->permissions()->detach($permissionIds);

        $this->flushCache();
    }

    public function flushCache(): void
    {
        $version = (int) Cache::get(self::VERSION_KEY, 1);

        Cache::forever(self::VERSION_KEY, $version + 1);
    }

    private function key(string $suffix): string
    {
        return sprintf('rbac:v%d:%s', (int) Cache::get(self::VERSION_KEY, 1), $suffix);
    }
}
