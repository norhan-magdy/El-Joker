<?php

namespace App\Http\Middleware;

use App\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    public function __construct(private readonly PermissionService $permissions)
    {
    }

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        foreach ($permissions as $permission) {
            if ($this->permissions->userHasPermission($user, $permission)) {
                return $next($request);
            }
        }

        abort(403, 'You do not have the required permission.');
    }
}
