"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";

import { login, type LoginState } from "@/actions/auth";

const initialState: LoginState = {
  success: false,
};

export function LoginForm() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(login, initialState);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.success) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#635bff] text-white shadow-lg shadow-[#635bff]/20">
            <span className="text-lg font-bold">A</span>
          </div>

          <h1 className="mt-5 text-xl font-bold tracking-tight text-zinc-900">
            Agenda Flow
          </h1>

          <p className="mt-1 text-sm text-zinc-400">
            Acesse o painel do seu negócio
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-zinc-900">Entrar</h2>

            <p className="mt-1 text-xs text-zinc-400">
              Informe seus dados para continuar.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
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
                  required
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  disabled={pending}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 disabled:bg-zinc-50"
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
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  disabled={pending}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-10 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 disabled:bg-zinc-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={pending}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                >
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] text-sm font-semibold text-white transition hover:bg-[#5148e8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                "Entrando..."
              ) : (
                <>
                  Entrar
                  <FiArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400">
          Agenda Flow
        </p>
      </div>
    </main>
  );
}
