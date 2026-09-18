"use client";

import { useActionState, useEffect, useRef } from "react";
import { FiCheck, FiLoader, FiX } from "react-icons/fi";

import { createClient, type CreateClientState } from "@/actions/clients";

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (client: NonNullable<CreateClientState["client"]>) => void;
}

const initialState = {
  success: false,
  error: "",
};

export function NewClientModal({
  open,
  onClose,
  onCreated,
}: NewClientModalProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    createClient,
    initialState,
  );

  useEffect(() => {
    if (!state.success || !state.client) {
      return;
    }

    formRef.current?.reset();

    onCreated(state.client);
    onClose();
  }, [state.success, state.client, onCreated, onClose]);

  if (!open) {
    return null;
  }

  function handleClose() {
    if (pending) {
      return;
    }

    formRef.current?.reset();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onMouseDown={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Novo cliente
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              Adicione um novo cliente ao seu negócio.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={pending}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
          >
            <FiX size={17} />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="client-name"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Nome
            </label>

            <input
              id="client-name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={100}
              placeholder="Ex.: João Martins"
              disabled={pending}
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
            />
          </div>

          <div>
            <label
              htmlFor="client-email"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              E-mail
            </label>

            <input
              id="client-email"
              name="email"
              type="email"
              required
              maxLength={150}
              placeholder="cliente@email.com"
              disabled={pending}
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
            />
          </div>

          <div>
            <label
              htmlFor="client-phone"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Telefone
            </label>

            <input
              id="client-phone"
              name="phone"
              type="tel"
              required
              minLength={10}
              maxLength={30}
              placeholder="(21) 99999-9999"
              disabled={pending}
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
            />
          </div>

          {state.error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600"
            >
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={pending}
              className="h-10 rounded-xl px-4 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#635bff] px-4 text-xs font-semibold text-white transition hover:bg-[#5148e8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <FiLoader size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <FiCheck size={14} />
                  Salvar cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
