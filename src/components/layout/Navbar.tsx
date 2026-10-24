"use client";

import Link from "next/link";
import { FiArrowRight, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";

interface NavbarProps {
  user: {
    role: "owner" | "client";
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const homeHref = user ? (user.role === "owner" ? "/dashboard" : "/cliente") : "/entrar";
  const startHref = user ? homeHref : "/criar-conta";
  const startLabel = user
    ? user.role === "owner" ? "Acessar painel" : "Meus agendamentos"
    : "Começar agora";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <nav className="flex h-14 items-center justify-between rounded-2xl border border-white/10 bg-slate-900/85 px-4 text-white shadow-lg shadow-black/20 backdrop-blur-xl sm:px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold tracking-tight"
            onClick={() => setIsOpen(false)}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635bff] text-xs font-bold text-white">
              A
            </span>

            <span>AgendaFlow</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link
              href="#recursos"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Recursos
            </Link>

            <Link
              href="#como-funciona"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Como funciona
            </Link>

            <Link
              href="#beneficios"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Benefícios
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={homeHref}
              className="text-sm font-medium text-slate-200 transition-colors hover:text-white"
            >
              {user ? "Meu painel" : "Entrar"}
            </Link>

            <Link
              href={startHref}
              className="flex items-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5148e8]"
            >
              {startLabel}
              <FiArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setIsOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 transition-colors hover:bg-white/10 md:hidden"
          >
            {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </nav>

        {isOpen && (
          <div className="mt-2 rounded-2xl border border-white/10 bg-slate-900 p-3 text-white shadow-lg md:hidden">
            <div className="flex flex-col">
              <Link
                href="#recursos"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Recursos
              </Link>

              <Link
                href="#como-funciona"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Como funciona
              </Link>

              <Link
                href="#beneficios"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Benefícios
              </Link>

              <div className="my-2 h-px bg-white/10" />

              <Link
                href={homeHref}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
              >
                {user ? "Meu painel" : "Entrar"}
              </Link>

              <Link
                href={startHref}
                onClick={() => setIsOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white"
              >
                {startLabel}
                <FiArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
