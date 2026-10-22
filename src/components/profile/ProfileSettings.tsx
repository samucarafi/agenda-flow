"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changeAccountPassword, updateProfile, type ProfileActionState } from "@/actions/profile";

const initialState: ProfileActionState = { success: false };

export function ProfileSettings({
  initialName,
  initialEmail,
  role,
}: {
  initialName: string;
  initialEmail: string;
  role: "owner" | "client";
}) {
  const router = useRouter();
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(changeAccountPassword, initialState);

  useEffect(() => {
    if (profileState.success || passwordState.success) router.refresh();
  }, [profileState.success, passwordState.success, router]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Informações pessoais</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Seus dados de acesso</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">Altere seu nome ou e-mail. Para confirmar, informe sua senha atual.</p>
        </div>
        <form action={profileAction} className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Nome completo" name="name" type="text" defaultValue={initialName} autoComplete="name" />
          <ProfileField label="E-mail de acesso" name="email" type="email" defaultValue={initialEmail} autoComplete="email" />
          <div className="sm:col-span-2">
            <ProfileField label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" />
          </div>
          <div className="sm:col-span-2">
            <FormFeedback state={profileState} />
            <button type="submit" disabled={profilePending} className="mt-4 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
              {profilePending ? "Salvando…" : "Salvar informações"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Segurança</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Trocar senha</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">Escolha uma senha pessoal com pelo menos 8 caracteres.</p>
        </div>
        <form action={passwordAction} className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" />
          <div className="hidden sm:block" />
          <ProfileField label="Nova senha" name="newPassword" type="password" autoComplete="new-password" minLength={8} />
          <ProfileField label="Confirme a nova senha" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} />
          <div className="sm:col-span-2">
            <FormFeedback state={passwordState} />
            <button type="submit" disabled={passwordPending} className="mt-4 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
              {passwordPending ? "Atualizando…" : "Atualizar senha"}
            </button>
          </div>
        </form>
      </section>

      <p className="px-1 text-xs text-slate-400">Tipo de conta: {role === "owner" ? "Proprietário" : "Cliente"}</p>
    </div>
  );
}

function ProfileField({
  label,
  name,
  type,
  defaultValue,
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  type: "text" | "email" | "password";
  defaultValue?: string;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-slate-200">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={name === "name" ? 100 : type === "password" ? 100 : 254}
        className="h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
      />
    </label>
  );
}

function FormFeedback({ state }: { state: ProfileActionState }) {
  if (state.error) return <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-200">{state.message}</p>;
  return null;
}
