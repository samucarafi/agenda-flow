"use client";

import Link from "next/link";
import { useState } from "react";

import {
  FiCalendar,
  FiGrid,
  FiMenu,
  FiSettings,
  FiUsers,
  FiScissors,
  FiX,
} from "react-icons/fi";
import { LogoutButton } from "../auth/LogoutButton";

const navigation = [
  {
    label: "Visão geral",
    href: "/dashboard",
    icon: FiGrid,
  },
  {
    label: "Agenda",
    href: "/dashboard/agenda",
    icon: FiCalendar,
  },
  {
    label: "Clientes",
    href: "/dashboard/clientes",
    icon: FiUsers,
  },
  {
    label: "Serviços",
    href: "/dashboard/servicos",
    icon: FiScissors,
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    icon: FiSettings,
  },
];

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm lg:hidden"
      >
        <FiMenu size={18} />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/20 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-zinc-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635bff] text-xs text-white">
              A
            </span>
            AgendaFlow
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 lg:hidden"
          >
            <FiX size={17} />
          </button>
        </div>

        <div className="flex-1 px-3 py-5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Menu
          </p>

          <nav className="mt-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-100 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#635bff]/10 text-xs font-semibold text-[#635bff]">
              {user.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-800">
                {user.name}
              </p>

              <p className="truncate text-[10px] text-zinc-400">{user.email}</p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
