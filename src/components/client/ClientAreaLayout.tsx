import type { ReactNode } from "react";
import { ClientNavigation } from "@/components/navigation/ClientNavigation";

export function ClientAreaLayout({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "wide" | "standard";
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className={`mx-auto ${width === "wide" ? "max-w-6xl" : "max-w-4xl"}`}>
        <ClientNavigation />
        {children}
      </div>
    </main>
  );
}
