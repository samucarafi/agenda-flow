"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FiBriefcase,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiGrid,
  FiMenu,
  FiScissors,
  FiSettings,
  FiUsers,
  FiUser,
  FiX,
} from "react-icons/fi";

import { LogoutButton } from "@/components/auth/LogoutButton";

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
  businessCategory?: string;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof FiGrid;
}

export function Sidebar({ user, businessCategory }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const businessMatch = pathname.match(
    /^\/dashboard\/negocios\/([a-f\d]{24})(?:\/|$)/i,
  );
  const businessId = businessMatch?.[1];

  const isRestaurant = businessCategory === "restaurant";
  const navigation: NavigationItem[] = businessId
    ? isRestaurant
      ? [
          { label: "Visão geral", href: `/dashboard/negocios/${businessId}`, icon: FiGrid },
          { label: "Fila de espera", href: `/dashboard/negocios/${businessId}/fila-de-espera`, icon: FiClock },
          { label: "Mesas", href: `/dashboard/negocios/${businessId}/mesas`, icon: FiGrid },
          { label: "Menu digital", href: `/dashboard/negocios/${businessId}/menu`, icon: FiBookOpen },
          { label: "Configurações", href: `/dashboard/negocios/${businessId}/configuracoes`, icon: FiSettings },
        ]
      : [
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

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-40 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-[#111C30] text-slate-200 shadow-lg transition hover:bg-slate-800 lg:hidden"
      >
        <FiMenu size={20} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#0F172A] transition-transform duration-200 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="text-lg font-bold tracking-tight text-slate-100"
          >
            Agenda<span className="text-cyan-400">Flow</span>
          </Link>

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            {businessId ? "Gestão do negócio" : "Área administrativa"}
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isBusinessOverview =
                businessId && item.href === `/dashboard/negocios/${businessId}`;
              const active =
                pathname === item.href ||
                (!isBusinessOverview &&
                  item.href !== "/dashboard" &&
                  item.href !== "/dashboard/negocios" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                    active
                      ? "border-cyan-400/15 bg-cyan-400/10 font-semibold text-cyan-300"
                      : "border-transparent text-white hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Icon
                    size={17}
                    className={
                      active
                        ? "text-cyan-300"
                        : "text-slate-200 transition group-hover:text-white"
                    }
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-semibold text-slate-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-200">{user.email}</p>
          </div>

          <Link
            href="/perfil"
            onClick={() => setMobileOpen(false)}
            aria-current={pathname === "/perfil" ? "page" : undefined}
            className={`mb-2 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${pathname === "/perfil" ? "border-cyan-400/15 bg-cyan-400/10 text-cyan-300" : "border-transparent text-white hover:bg-white/[0.08] hover:text-white"}`}
          >
            <FiUser size={17} />
            Meu perfil
          </Link>

          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
