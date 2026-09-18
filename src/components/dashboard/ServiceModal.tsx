"use client";

import { useActionState, useEffect, useRef } from "react";
import { FiCheck, FiClock, FiLoader, FiX } from "react-icons/fi";

import {
  createService,
  updateService,
  type CreateServiceState,
} from "@/actions/services";

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (service: NonNullable<CreateServiceState["service"]>) => void;
  service?: NonNullable<CreateServiceState["service"]> | null;
}

const initialState: CreateServiceState = {
  success: false,
};

export function ServiceModal({
  open,
  onClose,
  onCreated,
  service,
}: ServiceModalProps) {
  const isEditing = Boolean(service);

  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    saveService,
    initialState,
  );

  useEffect(() => {
    if (!state.success || !state.service) {
      return;
    }

    formRef.current?.reset();

    onCreated(state.service);
    onClose();
  }, [state.success, state.service, onCreated, onClose]);

  async function saveService(
    previousState: CreateServiceState,
    formData: FormData,
  ): Promise<CreateServiceState> {
    const serviceId = formData.get("serviceId");

    if (typeof serviceId === "string" && serviceId) {
      return updateService(serviceId, formData);
    }

    return createService(previousState, formData);
  }

  function handleClose() {
    if (pending) {
      return;
    }

    formRef.current?.reset();
    onClose();
  }

  if (!open) {
    return null;
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
              {isEditing ? "Editar serviço" : "Novo serviço"}
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              {isEditing
                ? "Atualize as informações do serviço."
                : "Cadastre um serviço oferecido pelo seu negócio."}
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
              htmlFor="service-name"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Nome
            </label>

            <input type="hidden" name="serviceId" value={service?._id ?? ""} />

            <input
              id="service-name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              defaultValue={service?.name ?? ""}
              placeholder="Ex.: Corte masculino"
              disabled={pending}
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
            />
          </div>

          <div>
            <label
              htmlFor="service-description"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Descrição
              <span className="ml-1 font-normal text-zinc-400">(opcional)</span>
            </label>

            <textarea
              id="service-description"
              name="description"
              maxLength={500}
              rows={3}
              defaultValue={service?.description ?? ""}
              placeholder="Ex.: Corte tradicional masculino."
              disabled={pending}
              className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="service-duration"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Duração
              </label>

              <div className="relative">
                <FiClock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="service-duration"
                  name="duration"
                  type="number"
                  required
                  min={5}
                  max={480}
                  step={5}
                  defaultValue={service?.duration ?? ""}
                  placeholder="30"
                  disabled={pending}
                  className="h-10 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
                />
              </div>

              <p className="mt-1 text-[10px] text-zinc-400">Em minutos</p>
            </div>

            <div>
              <label
                htmlFor="service-price"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Valor
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  R$
                </span>

                <input
                  id="service-price"
                  name="price"
                  type="number"
                  required
                  min={0}
                  max={999999}
                  step="0.01"
                  defaultValue={service?.price ?? ""}
                  placeholder="45.00"
                  disabled={pending}
                  className="h-10 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
                />
              </div>
            </div>
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
                  {isEditing ? "Salvar alterações" : "Salvar serviço"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
