import type { ReactNode } from "react";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <Header />
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 xl:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </RequireAuth>
  );
}