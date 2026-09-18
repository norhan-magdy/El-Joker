import type { ReactNode } from "react";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}