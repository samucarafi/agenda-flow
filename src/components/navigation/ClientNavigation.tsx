"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Visão geral", href: "/cliente" },
  { label: "Minha fila", href: "/cliente/fila" },
];

export function ClientNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação da área do cliente" className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${active ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
