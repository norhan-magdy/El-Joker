"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { registerApi, errorMessage } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (token && bootstrapped) router.replace("/");
  }, [token, bootstrapped, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await registerApi(data);
      setSession(res.user, res.token);
      toast.success("Account created");
      router.push("/");
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      if (apiErr.kind === "validation" && apiErr.errors) {
        for (const [field, msgs] of Object.entries(apiErr.errors)) {
          setError(field as keyof RegisterForm, { message: msgs[0] });
        }
      } else {
        toast.error(errorMessage(err));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="mb-2 text-xl font-semibold text-text-primary">Create an account</h1>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
        {errors.name ? <p className="text-sm text-error" role="alert">{errors.name.message}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        {errors.email ? <p className="text-sm text-error" role="alert">{errors.email.message}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? <p className="text-sm text-error" role="alert">{errors.password.message}</p> : null}
      </div>
      <Button type="submit" fullWidth loading={isSubmitting}>
        Create account
      </Button>
      <p className="mt-2 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
          Sign in
        </Link>
      </p>
    </form>
  );
}