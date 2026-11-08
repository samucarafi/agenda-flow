"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerOwner, type OwnerRegistrationState } from "@/actions/owner-registration";

const initialState: OwnerRegistrationState = { success: false };

export function OwnerSignupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(registerOwner, initialState);
  useEffect(() => { if (state.success) router.replace("/entrar?cadastro=empreendedor"); }, [state.success, router]);

  return <form action={action} className="space-y-4">
    <label className="block text-sm text-slate-200">Seu nome<input name="name" autoComplete="name" required maxLength={100} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none focus:border-indigo-400" /></label>
    <label className="block text-sm text-slate-200">E-mail<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none focus:border-indigo-400" /></label>
    <label className="block text-sm text-slate-200">Senha<input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none focus:border-indigo-400" /><span className="mt-1 block text-xs text-slate-500">Mínimo de 8 caracteres.</span></label>
    <label className="flex items-start gap-3 text-xs leading-5 text-slate-400"><input name="acceptedTerms" type="checkbox" required className="mt-1 size-4 accent-indigo-500" /><span>Li e aceito os <Link className="text-indigo-300 underline" href="/termos" target="_blank">Termos de Uso</Link> e a <Link className="text-indigo-300 underline" href="/privacidade" target="_blank">Política de Privacidade</Link>.</span></label>
    {state.error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{state.error}</p>}
    <button disabled={pending} className="h-12 w-full rounded-xl bg-indigo-500 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">{pending ? "Criando conta…" : "Começar meus 30 dias grátis"}</button>
    <p className="text-center text-xs text-slate-500">Sem cartão. Sem cobrança durante o teste. Após 30 dias, você escolhe se deseja contratar.</p>
  </form>;
}
