<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_admin' => (bool) $user->is_admin,
            'roles' => $user->roles->pluck('name')->all(),
        ];
    }

    private function credentialsAreValid(string $password, User $user): bool
    {
        return Hash::check($password, $user->password);
    }

    private function issueToken(User $user, string $name): string
    {
        $user->tokens()->where('name', $name)->delete();

        return $user->createToken($name, expiresAt: now()->addMinutes((int) config('sanctum.expiration')))->plainTextToken;
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            // 'device_name' => 'nullable|string', // Device-Based Sessions
        ]);

        $user = User::create($validated);

        app(\App\Services\PermissionService::class)->assignRole($user, 'customer');

        return response()->json([
            'token' => $this->issueToken($user, 'api'),
            'user' => $this->userPayload($user->load('roles')),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('roles')->where('email', $validated['email'])->first();

        if (! $user || ! $this->credentialsAreValid($validated['password'], $user) || ! $user->is_active) {
            return response()->json(['message' => 'Invalid credentials.'], 422);
        }

        return response()->json([
            'token' => $this->issueToken($user, 'api'),
            'user' => $this->userPayload($user),
        ]);
    }

    public function createAdminToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('roles')->where('email', $validated['email'])->first();

        if (! $user || ! $this->credentialsAreValid($validated['password'], $user) || ! $user->is_active) {
            return response()->json(['message' => 'Invalid credentials.'], 422);
        }

        if (! $user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'token' => $this->issueToken($user, 'admin'),
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        return response()->json(['data' => $this->userPayload($user)]);
    }
}
