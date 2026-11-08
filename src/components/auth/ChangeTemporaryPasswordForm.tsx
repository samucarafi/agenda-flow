"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiLock, FiShield } from "react-icons/fi";
import { changeTemporaryPassword, type AuthState } from "@/actions/auth";

const initialState: AuthState = { success: false };

export function ChangeTemporaryPasswordForm() {
  const [state, formAction, pending] = useActionState(
    changeTemporaryPassword,
    initialState,
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d1b] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111a2d]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
          <FiLock size={23} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          AgendaFlow · Primeiro acesso
        </p>

        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Defina sua senha pessoal
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Para proteger sua conta, substitua a senha temporária por uma senha
          pessoal antes de continuar.
        </p>

        <div className="mt-5 flex gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] p-3">
          <FiShield className="mt-0.5 shrink-0 text-cyan-400" size={18} />
          <p className="text-xs leading-5 text-slate-300">
            Sua nova senha deve ter pelo menos 8 caracteres e ser conhecida
            somente por você.
          </p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <Field
            label="Senha temporária"
            name="currentPassword"
            autoComplete="current-password"
          />

          <Field
            label="Nova senha"
            name="newPassword"
            autoComplete="new-password"
          />

          <Field
            label="Confirme a nova senha"
            name="confirmPassword"
            autoComplete="new-password"
          />

          {state.error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-3 text-sm text-rose-300"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111a2d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Não consegue acessar?{" "}
          <Link
            className="font-semibold text-cyan-400 transition hover:text-cyan-300"
            href="/"
          >
            Voltar ao início
          </Link>
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  autoComplete,
}: {
  label: string;
  name: string;
  autoComplete: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-300">
      {label}

      <input
        required
        minLength={name === "currentPassword" ? undefined : 8}
        type="password"
        name={name}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
      />
    </label>
  );
}
