"use client";

import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-2 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:text-primary-hover">
          Create one
        </Link>
      </p>
    </div>
  );
}