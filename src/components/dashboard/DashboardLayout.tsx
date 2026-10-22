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
  showHeader?: boolean;
  businessCategory?: string;
}

export function DashboardLayout({
  children,
  title,
  description,
  backHref,
  backLabel = "Voltar",
  showHeader = true,
  businessCategory,
}: DashboardLayoutProps) {
  const user = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <Sidebar user={user} businessCategory={businessCategory} />

      <main className="min-w-0 flex-1 bg-slate-50 text-slate-900">
        {showHeader && (
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur-xl">
            <div className="flex min-h-16 items-center gap-3 px-5 py-3 pl-16 lg:px-8 lg:pl-8">
              {backHref && (
                <BackButton fallbackHref={backHref} label={backLabel} />
              )}

              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-slate-900">
                  {title}
                </h1>

                {description && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </header>
        )}

        <div className={`mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${showHeader ? "py-6 lg:py-8" : "pb-6 pt-16 lg:py-8"}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
