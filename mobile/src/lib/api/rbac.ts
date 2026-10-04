import type { MessageResponse, Role, RolesPayload } from "@/lib/types";
import { api } from "./client";

export function listRoles(): Promise<RolesPayload> {
  return api.get<RolesPayload>("rbac/roles", { scope: "admin" });
}

export function createRole(
  body: { name: string }
): Promise<{ data: { id: number; name: string } }> {
  return api.post<{ data: { id: number; name: string } }>(
    "rbac/roles",
    body,
    { scope: "admin" }
  );
}

/** Fails with 409 when the role is still assigned to users. */
export function deleteRole(id: number): Promise<MessageResponse> {
  return api.delete<MessageResponse>(`rbac/roles/${id}`, { scope: "admin" });
}

export function givePermissions(
  roleId: number,
  permissions: string[]
): Promise<MessageResponse> {
  return api.post<MessageResponse>(
    `rbac/roles/${roleId}/permissions`,
    { permissions },
    { scope: "admin" }
  );
}

export function revokePermissions(
  roleId: number,
  permissions: string[]
): Promise<MessageResponse> {
  return api.delete<MessageResponse>(`rbac/roles/${roleId}/permissions`, {
    scope: "admin",
    body: { permissions },
  });
}

export function syncUserRoles(
  userId: string,
  roles: string[]
): Promise<{ data: Role[] }> {
  return api.put<{ data: Role[] }>(`rbac/users/${userId}/roles`, { roles }, {
    scope: "admin",
  });
}