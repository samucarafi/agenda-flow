"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { FiCheck, FiCopy, FiLoader, FiX } from "react-icons/fi";

import { createClient, type CreateClientState } from "@/actions/clients";
import { PhoneInput } from "@/components/forms/PhoneInput";

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (
    client: NonNullable<CreateClientState["client"]>,
    alreadyExists?: boolean,
    accountCreated?: boolean,
  ) => void;
  businessId: string;
}

const initialState: CreateClientState = {
  success: false,
  error: "",
};

export function NewClientModal({
  open,
  onClose,
  onCreated,
  businessId,
}: NewClientModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  // Processa o resultado dentro da própria Server Action do formulário.
  // Isso evita efeitos que atualizam estado em cascata após a renderização.
  const submitClient = useCallback(
    async (previousState: CreateClientState, formData: FormData) => {
      const result = await createClient(previousState, formData);

      if (result.success && result.client) {
        formRef.current?.reset();
        onCreated(result.client, result.alreadyExists, result.accountCreated);

        if (result.temporaryPassword) {
          setCredentials({
            email: result.client.email,
            password: result.temporaryPassword,
          });
        } else {
          onClose();
        }
      }

      return result;
    },
    [onCreated, onClose],
  );

  const [state, formAction, pending] = useActionState(submitClient, initialState);

  if (!open) return null;

  async function copyCredentials() {
    if (!credentials) return;

    try {
      await navigator.clipboard.writeText(
        `E-mail: ${credentials.email}\nSenha temporária: ${credentials.password}`,
      );
      setCopyMessage("Credenciais copiadas.");
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente. Copie os dados manualmente.");
    }
  }

  function handleClose() {
    if (pending) return;

    formRef.current?.reset();
    setCredentials(null);
    setCopyMessage("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/50 p-4 backdrop-blur-sm"
      onMouseDown={handleClose}
    >
      <div
        className="my-auto w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Novo cliente</h2>
            <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">
              Um novo e-mail recebe uma conta com senha temporária. Contas existentes
              são vinculadas sem alterar a senha atual.
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

        {credentials ? (
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Acesso criado — guarde esta senha agora</p>
              <p className="mt-3 break-all">
                E-mail: <strong>{credentials.email}</strong>
              </p>
              <p className="mt-1 break-all">
                Senha temporária:{" "}
                <strong className="font-mono">{credentials.password}</strong>
              </p>
              <p className="mt-3 text-xs leading-5">
                Esta senha só será exibida agora. No primeiro acesso, o cliente
                deverá escolher uma nova senha pessoal.
              </p>
            </div>

            <button
              type="button"
              onClick={copyCredentials}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 text-xs font-semibold text-white transition hover:bg-amber-800"
            >
              <FiCopy size={14} />
              Copiar credenciais
            </button>

            {copyMessage && (
              <p role="status" className="text-center text-xs text-zinc-500">
                {copyMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="h-10 w-full rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="space-y-4 p-5">
            <input type="hidden" name="businessId" value={businessId} />

            <div>
              <label htmlFor="client-name" className="mb-1.5 block text-xs font-medium text-zinc-700">
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
              <label htmlFor="client-email" className="mb-1.5 block text-xs font-medium text-zinc-700">
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
              <label htmlFor="client-phone" className="mb-1.5 block text-xs font-medium text-zinc-700">
                Telefone
              </label>
              <PhoneInput
                id="client-phone"
                name="phone"
                required
                minLength={14}
                placeholder="(21) 99999-9999"
                disabled={pending}
                className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
              />
            </div>

            {state.error && (
              <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600">
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
                    Criar acesso
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
