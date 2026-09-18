import type { ReactNode } from "react";
import { Sidebar, AdminTopbar } from "@/components/shell/Sidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth loginPath="/admin/login">
      <div className="min-h-full">
        <Sidebar />
        <div className="flex min-h-screen flex-col pl-0 lg:pl-64">
          <AdminTopbar title="El-Joker Admin" />
          <main id="main-content" className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}