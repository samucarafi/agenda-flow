"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changeTemporaryPassword, type AuthState } from "@/actions/auth";

const initialState: AuthState = { success: false };

export function ChangeTemporaryPasswordForm() {
  const [state, formAction, pending] = useActionState(changeTemporaryPassword, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Primeiro acesso</p>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Defina sua senha pessoal</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">A senha temporária foi criada pelo estabelecimento. Troque-a agora para acessar e acompanhar sua fila com segurança.</p>
        <form action={formAction} className="mt-6 space-y-4">
          <Field label="Senha temporária" name="currentPassword" autoComplete="current-password" />
          <Field label="Nova senha (mínimo de 8 caracteres)" name="newPassword" autoComplete="new-password" />
          <Field label="Confirme a nova senha" name="confirmPassword" autoComplete="new-password" />
          {state.error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{state.error}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {pending ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-zinc-500">Não consegue acessar? <Link className="font-semibold text-indigo-600 hover:underline" href="/">Voltar ao início</Link></p>
      </section>
    </main>
  );
}

function Field({ label, name, autoComplete }: { label: string; name: string; autoComplete: string }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-zinc-700">
      {label}
      <input required minLength={name === "currentPassword" ? undefined : 8} type="password" name={name} autoComplete={autoComplete} className="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
    </label>
  );
}
