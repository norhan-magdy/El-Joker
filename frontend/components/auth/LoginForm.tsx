"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { loginApi, adminLoginApi, errorMessage } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm({ admin = false, redirectTo }: { admin?: boolean; redirectTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const target = next ?? redirectTo ?? (admin ? "/admin" : "/");
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (token && bootstrapped) router.replace(target);
  }, [token, bootstrapped, target, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const login = admin ? adminLoginApi : loginApi;
      const res = await login(data);
      setSession(res.user, res.token);
      toast.success("Logged in");
      router.push(target);
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      if (apiErr.kind === "validation" && apiErr.errors) {
        for (const [field, msgs] of Object.entries(apiErr.errors)) {
          setError(field as keyof LoginForm, { message: msgs[0] });
        }
      } else if (admin && apiErr.kind === "business" && apiErr.status === 403) {
        toast.error("Access denied. An admin account is required.");
      } else {
        toast.error(errorMessage(err));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="mb-2 text-xl font-semibold text-text-primary">Sign in</h1>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-error" role="alert">{errors.email.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-error" role="alert">{errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" fullWidth loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}