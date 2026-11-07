"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiLoader, FiLock, FiMail, FiUser } from "react-icons/fi";

import { register, type AuthState } from "@/actions/auth";

const initialState: AuthState = { success: false };

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(register, initialState);

  useEffect(() => {
    if (state.success) router.replace("/entrar");
  }, [state.success, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-indigo-600/15 blur-[110px]" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
          <FiArrowLeft size={16} /> Voltar para a página inicial
        </Link>
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#635bff] text-sm text-white shadow-lg shadow-indigo-500/20">A</span>
            AgendaFlow
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111c30]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Faça parte</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Criar sua conta</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Comece a organizar seu negócio com o AgendaFlow.</p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">Nome</label>
              <div className="relative">
                <FiUser size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="name" name="name" type="text" autoComplete="name" placeholder="Seu nome" required disabled={pending}
                  className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">E-mail</label>
              <div className="relative">
                <FiMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="email" name="email" type="email" autoComplete="email" placeholder="voce@email.com" required disabled={pending}
                  className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">Senha</label>
              <div className="relative">
                <FiLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Mínimo de 6 caracteres" required disabled={pending}
                  className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 disabled:opacity-60" />
              </div>
            </div>
            {state.error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3.5 py-3 text-sm text-rose-200">{state.error}</div>}
            <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-[#5148e8] disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? <><FiLoader size={16} className="animate-spin" /> Criando conta...</> : <>Criar conta <FiArrowRight size={16} /></>}
            </button>
          </form>
          <div className="mt-7 border-t border-white/10 pt-5 text-center">
            <p className="text-sm text-slate-400">Já possui uma conta?</p>
            <Link href="/entrar" className="mt-2 inline-block text-sm font-semibold text-indigo-300 transition hover:text-indigo-200">Entrar</Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">Sua gestão, do seu jeito.</p>
      </div>
    </main>
  );
}
