"use client";

import Link from "next/link";
import { FiArrowRight, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <nav className="flex h-14 items-center justify-between rounded-2xl border border-black/[0.06] bg-white/85 px-4 shadow-sm backdrop-blur-xl sm:px-5">
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
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-950"
            >
              Recursos
            </Link>

            <Link
              href="#como-funciona"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-950"
            >
              Como funciona
            </Link>

            <Link
              href="#beneficios"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-950"
            >
              Benefícios
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
            >
              Entrar
            </Link>

            <Link
              href="/agenda"
              className="flex items-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5148e8]"
            >
              Começar agora
              <FiArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setIsOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 md:hidden"
          >
            {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </nav>

        {isOpen && (
          <div className="mt-2 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-lg md:hidden">
            <div className="flex flex-col">
              <Link
                href="#recursos"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Recursos
              </Link>

              <Link
                href="#como-funciona"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Como funciona
              </Link>

              <Link
                href="#beneficios"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Benefícios
              </Link>

              <div className="my-2 h-px bg-zinc-100" />

              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Entrar
              </Link>

              <Link
                href="#agendar"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white"
              >
                Começar agora
                <FiArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
