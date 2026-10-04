import { api } from "./client";
import type {
  AuthResponse,
  LoginBody,
  MessageResponse,
  RegisterBody,
  User,
} from "@/lib/types";

export function registerApi(body: RegisterBody): Promise<AuthResponse> {
  return api.post<AuthResponse>("auth/register", body, { scope: "public" });
}

/**
 * Issues a token named `api`. Note this revokes any other `api`-named token,
 * including the one the web storefront is using for the same account.
 */
export function loginApi(body: LoginBody): Promise<AuthResponse> {
  return api.post<AuthResponse>("auth/login", body, { scope: "public" });
}

/**
 * Issues a token named `admin`. Because the token name differs from the
 * customer login, both sessions can be alive on one device at the same time.
 * Responds 403 for a valid non-admin account.
 */
export function adminLoginApi(body: LoginBody): Promise<AuthResponse> {
  return api.post<AuthResponse>("admin/login", body, { scope: "public" });
}

export function logoutApi(): Promise<MessageResponse> {
  return api.post<MessageResponse>("auth/logout", undefined, {
    scope: "customer",
  });
}

export function adminLogoutApi(): Promise<MessageResponse> {
  return api.post<MessageResponse>("auth/logout", undefined, { scope: "admin" });
}

/** The one endpoint that confirms a stored token is still valid. */
export function getMe(scope: "customer" | "admin"): Promise<{ data: User }> {
  return api.get<{ data: User }>("auth/me", { scope });
}