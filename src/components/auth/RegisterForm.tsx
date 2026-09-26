"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiLoader, FiLock, FiMail, FiUser } from "react-icons/fi";

import { register, type AuthState } from "@/actions/auth";

const initialState: AuthState = {
  success: false,
};

export function RegisterForm() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(register, initialState);

  useEffect(() => {
    if (state.success) {
      router.replace("/entrar");
    }
  }, [state.success, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#635bff] text-xs text-white">
              A
            </span>
            AgendaFlow
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              Criar sua conta
            </h1>

            <p className="mt-1.5 text-sm text-zinc-400">
              Crie sua conta para começar a usar o AgendaFlow.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Nome
              </label>

              <div className="relative">
                <FiUser
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  required
                  disabled={pending}
                  className="h-11 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 disabled:bg-zinc-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                E-mail
              </label>

              <div className="relative">
                <FiMail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  required
                  disabled={pending}
                  className="h-11 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 disabled:bg-zinc-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Senha
              </label>

              <div className="relative">
                <FiLock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo de 6 caracteres"
                  required
                  disabled={pending}
                  className="h-11 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 disabled:bg-zinc-50"
                />
              </div>
            </div>

            {state.error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600"
              >
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] text-sm font-semibold text-white transition hover:bg-[#5148e8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <FiLoader size={15} className="animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <FiArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-5 text-center">
            <p className="text-xs text-zinc-400">Já possui uma conta?</p>

            <Link
              href="/entrar"
              className="mt-1 inline-block text-xs font-semibold text-[#635bff] hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
