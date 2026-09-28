<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncUserRolesRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function __construct(private readonly PermissionService $permissions)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Role::with('permissions:id,name')->get(['id', 'name'])
                ->map(fn (Role $role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
                ]),
            'available_permissions' => Permission::pluck('name'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
        ]);

        $role = Role::create($validated);

        $this->permissions->flushCache();

        return response()->json(['data' => $role], 201);
    }

    public function destroy(Role $role): JsonResponse
    {
        abort_if($role->users()->exists(), 409, 'Role is assigned to users.');

        $role->permissions()->detach();
        $role->delete();

        $this->permissions->flushCache();

        return response()->json(['message' => 'Role deleted.']);
    }

    public function givePermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ]);

        $this->permissions->givePermissionTo($role, $validated['permissions']);

        return response()->json(['message' => 'Permissions granted.']);
    }

    public function revokePermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ]);

        $this->permissions->revokePermissionFrom($role, $validated['permissions']);

        return response()->json(['message' => 'Permissions revoked.']);
    }

    public function syncUserRoles(SyncUserRolesRequest $request, User $user): JsonResponse
    {
        $this->permissions->syncUserRoles($user, $request->input('roles'));

        return response()->json([
            'data' => $user->roles()->get(['id', 'name']),
        ]);
    }
}
