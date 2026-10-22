"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Section = "home" | "menu" | "queue" | "booking";

export function PublicBusinessNavigation({
  slug,
  category,
  bookingEnabled,
  current,
  accentColor,
  accentText,
  foregroundColor,
}: {
  slug: string;
  category: string;
  bookingEnabled: boolean;
  current: Section;
  accentColor?: string;
  accentText?: string;
  foregroundColor?: string;
}) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<Section>(current);
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
    { label: "Minha conta", href: "/cliente", section: null },
  ];

  useEffect(() => {
    function updateActiveSection() {
      if (pathname === base) {
        setActiveSection(window.location.hash === "#cardapio" || window.location.hash === "#servicos" ? "menu" : "home");
      } else if (pathname === `${base}/fila`) {
        setActiveSection("queue");
      } else if (pathname === `${base}/agendar`) {
        setActiveSection("booking");
      } else {
        setActiveSection(current);
      }
    }
    updateActiveSection();
    window.addEventListener("hashchange", updateActiveSection);
    window.addEventListener("popstate", updateActiveSection);
    return () => {
      window.removeEventListener("hashchange", updateActiveSection);
      window.removeEventListener("popstate", updateActiveSection);
    };
  }, [base, current, pathname]);

  return (
    <nav aria-label="Navegação do estabelecimento" className="flex gap-2 overflow-x-auto rounded-2xl border border-current/10 bg-black/10 p-2" style={{ color: foregroundColor }}>
      {links.map((link) => {
        const active = link.section !== null && link.section === activeSection;
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              if (link.section === "home" || link.section === "menu") setActiveSection(link.section);
            }}
            className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${active ? "text-slate-950" : "opacity-80 hover:bg-black/10 hover:opacity-100"}`}
            style={active ? { backgroundColor: accentColor ?? "#FFFFFF", color: accentColor ? accentText ?? foregroundColor : "#0F172A" } : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
