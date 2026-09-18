import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function DashboardLayout({
  children,
  title,
  description,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f6f7fb]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <header className="border-b border-zinc-200 bg-white">
          <div className="flex h-16 items-center px-5 pl-16 lg:px-8 lg:pl-8">
            <div>
              <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>

              <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
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
