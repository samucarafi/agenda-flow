"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiCalendar,
  FiGrid,
  FiMenu,
  FiSettings,
  FiUsers,
  FiScissors,
  FiX,
  FiBriefcase,
} from "react-icons/fi";
import { useState } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
}

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof FiGrid;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const businessMatch = pathname.match(
    /^\/dashboard\/negocios\/([a-f\d]{24})(?:\/|$)/i,
  );

  const businessId = businessMatch?.[1];

  const navigation: NavigationItem[] = businessId
    ? [
        {
          label: "Visão geral",
          href: `/dashboard/negocios/${businessId}`,
          icon: FiGrid,
        },
        {
          label: "Agenda",
          href: `/dashboard/negocios/${businessId}/agenda`,
          icon: FiCalendar,
        },
        {
          label: "Clientes",
          href: `/dashboard/negocios/${businessId}/clientes`,
          icon: FiUsers,
        },
        {
          label: "Serviços",
          href: `/dashboard/negocios/${businessId}/servicos`,
          icon: FiScissors,
        },
        {
          label: "Configurações",
          href: `/dashboard/negocios/${businessId}/configuracoes`,
          icon: FiSettings,
        },
      ]
    : [
        {
          label: "Visão geral",
          href: "/dashboard",
          icon: FiGrid,
        },
        {
          label: "Meus negócios",
          href: "/dashboard/negocios",
          icon: FiBriefcase,
        },
      ];

  function renderNavigation() {
    return (
      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.label === "Visão geral" && pathname === item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-[#635bff]/10 font-semibold text-[#635bff]"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm lg:hidden"
      >
        <FiMenu size={20} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-5">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-zinc-900"
          >
            Agenda<span className="text-[#635bff]">Flow</span>
          </Link>

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {businessId && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Gestão do negócio
            </p>
          )}

          {renderNavigation()}
        </div>

        <div className="border-t border-zinc-100 p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>

          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
