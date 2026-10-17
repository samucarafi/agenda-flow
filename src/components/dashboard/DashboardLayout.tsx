"use client";

import { Sidebar } from "./Sidebar";
import { useAuth } from "@/components/auth/AuthProvider";
import { BackButton } from "@/components/navigation/BackButton";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function DashboardLayout({
  children,
  title,
  description,
  backHref,
  backLabel = "Voltar",
}: DashboardLayoutProps) {
  const user = useAuth();

  return (
    <div className="flex min-h-screen bg-[#f6f7fb]">
      <Sidebar user={user} />

      <main className="min-w-0 flex-1">
        <header className="border-b border-zinc-200 bg-white">
          <div className="flex min-h-16 items-center gap-3 px-5 py-3 pl-16 lg:px-8 lg:pl-8">
            {backHref && (
              <BackButton fallbackHref={backHref} label={backLabel} />
            )}

            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>

              {description && (
                <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
