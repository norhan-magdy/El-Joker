import type { ReactNode } from "react";
import { Brand } from "@/components/shell/Brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}