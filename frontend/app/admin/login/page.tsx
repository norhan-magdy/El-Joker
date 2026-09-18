"use client";

import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Brand } from "@/components/shell/Brand";

export default function AdminLoginPage() {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <Suspense>
            <LoginForm admin />
          </Suspense>
          <p className="mt-2 text-center text-sm text-text-muted">
            Storefront?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
              Customer sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}