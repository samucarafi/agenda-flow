"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = "home" | "menu" | "queue" | "booking";

export function PublicBusinessNavigation({
  slug,
  category,
  bookingEnabled,
  current,
}: {
  slug: string;
  category: string;
  bookingEnabled: boolean;
  current: Section;
}) {
  const pathname = usePathname();
  const base = `/b/${slug}`;
  const restaurant = category === "restaurant";
  const links = [
    { label: "Início", href: base, section: "home" as const },
    ...(restaurant
      ? [
          { label: "Menu digital", href: `${base}#cardapio`, section: "menu" as const },
          { label: "Fila de espera", href: `${base}/fila`, section: "queue" as const },
        ]
      : [
          { label: "Serviços", href: `${base}#servicos`, section: "menu" as const },
          ...(bookingEnabled ? [{ label: "Agendar", href: `${base}/agendar`, section: "booking" as const }] : []),
        ]),
    { label: "Minha fila", href: "/cliente/fila", section: null },
    { label: "Minha conta", href: "/cliente", section: null },
  ];

  return (
    <nav aria-label="Navegação do estabelecimento" className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/10 p-2">
      {links.map((link) => {
        const active = link.section === current &&
          ((link.section === "home" || link.section === "menu") ? pathname === base : pathname === link.href);
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${active ? "bg-white text-slate-950" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
