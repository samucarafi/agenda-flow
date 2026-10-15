"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPlus } from "react-icons/fi";

import { createBusiness, type BusinessActionState } from "@/actions/businesses";

const initialState: BusinessActionState = {
  success: false,
};

export function CreateBusinessForm() {
  const [state, formAction, pending] = useActionState(
    createBusiness,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {state.error}
        </div>
      )}

      {state.success && state.business && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
        >
          <p className="font-medium text-emerald-400">
            Negócio criado com sucesso!
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {state.business.name} foi cadastrado como rascunho.
          </p>

          <Link
            href="/dashboard/negocios"
            className="mt-3 inline-flex text-sm font-medium text-emerald-400 hover:underline"
          >
            Ver meus negócios
          </Link>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-200"
        >
          Nome do negócio
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="Ex.: Barbearia Central"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-slate-200"
        >
          Categoria
        </label>

        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          <option value="barbershop">Barbearia</option>
          <option value="beauty_salon">Salão de beleza</option>
          <option value="restaurant">Restaurante</option>
          <option value="other">Outro tipo de negócio</option>
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-200"
        >
          Descrição
          <span className="ml-2 font-normal text-slate-500">(opcional)</span>
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          placeholder="Conte um pouco sobre seu estabelecimento..."
          className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link
          href="/dashboard/negocios"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
        >
          <FiArrowLeft />
          Voltar
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiPlus />
          {pending ? "Criando negócio..." : "Criar negócio"}
        </button>
      </div>
    </form>
  );
}
