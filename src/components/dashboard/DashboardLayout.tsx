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
  contentVariant?: "light" | "dark";
  fullBleed?: boolean;
}

export function DashboardLayout({
  children,
  title,
  description,
  backHref,
  backLabel = "Voltar",
  showHeader = true,
  businessCategory,
  contentVariant = "dark",
  fullBleed = false,
}: DashboardLayoutProps) {
  const user = useAuth();
  const isDark = contentVariant === "dark";

  return (
    <div className={`owner-dashboard min-h-screen lg:flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <Sidebar user={user} businessCategory={businessCategory} />

      <main className={`min-w-0 flex-1 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        {showHeader && (
          <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isDark ? "border-white/10 bg-slate-900/95 text-white" : "border-slate-200 bg-white/95 text-slate-900"}`}>
            <div className="flex min-h-16 items-center gap-3 px-5 py-3 pl-16 lg:px-8 lg:pl-8">
              {backHref && (
                <BackButton fallbackHref={backHref} label={backLabel} />
              )}

              <div className="min-w-0">
                <h1 className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {title}
                </h1>

                {description && (
                  <p className={`mt-0.5 truncate text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    {description}
                  </p>
                )}
              </div>
            </div>
          </header>
        )}

        <div className={`${fullBleed ? "min-h-[calc(100vh-4rem)] w-full bg-slate-950 pt-20 lg:pt-0" : "mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 sm:px-6 lg:px-8"} ${showHeader ? "py-6 lg:py-8" : fullBleed ? "" : "pb-6 pt-20 lg:py-8"}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
