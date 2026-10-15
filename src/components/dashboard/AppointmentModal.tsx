"use client";

import { FormEvent, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiLoader,
  FiUser,
  FiX,
} from "react-icons/fi";

import { createAppointment } from "@/actions/appointments";

type ClientOption = {
  _id: string;
  name: string;
};

type ServiceOption = {
  _id: string;
  name: string;
  duration: number;
  price: number;
};

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (appointment: {
    _id: string;
    client: ClientOption;
    service: ServiceOption;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    notes: string;
  }) => void;
  clients: ClientOption[];
  services: ServiceOption[];
  selectedDate: string;
}

export function AppointmentModal({
  open,
  onClose,
  onCreated,
  clients,
  services,
  selectedDate,
}: AppointmentModalProps) {
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  const selectedService = services.find((service) => service._id === serviceId);

  function resetForm() {
    setClientId("");
    setServiceId("");
    setDate(selectedDate);
    setStartTime("");
    setNotes("");
    setError("");
  }

  function handleClose() {
    if (pending) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!clientId) {
      setError("Selecione um cliente.");
      return;
    }

    if (!serviceId) {
      setError("Selecione um serviço.");
      return;
    }

    if (!date) {
      setError("Selecione uma data.");
      return;
    }

    if (!startTime) {
      setError("Informe o horário.");
      return;
    }

    try {
      setPending(true);

      const formData = new FormData();

      formData.set("clientId", clientId);
      formData.set("serviceId", serviceId);
      formData.set("date", date);
      formData.set("startTime", startTime);
      formData.set("notes", notes);

      const result = await createAppointment(
        {
          success: false,
        },
        formData,
      );

      if (!result.success || !result.appointment) {
        setError(result.error ?? "Não foi possível criar o agendamento.");

        return;
      }

      const client = clients.find(
        (item) => item._id === result.appointment?.clientId,
      );

      const service = services.find(
        (item) => item._id === result.appointment?.serviceId,
      );

      if (!client || !service) {
        setError("Não foi possível atualizar a agenda.");
        return;
      }

      onCreated({
        ...result.appointment,
        client,
        service,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error(error);

      setError("Ocorreu um erro ao criar o agendamento.");
    } finally {
      setPending(false);
    }
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
              Novo agendamento
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              Preencha os dados do atendimento.
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

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="appointment-client"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Cliente
            </label>

            <div className="relative">
              <FiUser
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <select
                id="appointment-client"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                disabled={pending}
                className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#635bff] disabled:bg-zinc-50"
              >
                <option value="">Selecione um cliente</option>

                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="appointment-service"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Serviço
            </label>

            <select
              id="appointment-service"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              disabled={pending}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-[#635bff] disabled:bg-zinc-50"
            >
              <option value="">Selecione um serviço</option>

              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} · {service.duration} min
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <div className="flex items-center gap-2 rounded-xl bg-[#635bff]/5 px-3 py-2.5 text-xs text-[#635bff]">
              <FiClock size={14} />

              <span>
                Duração: <strong>{selectedService.duration} minutos</strong>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="appointment-date"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Data
              </label>

              <div className="relative">
                <FiCalendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="appointment-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={pending}
                  className="h-10 w-full rounded-xl border border-zinc-200 pl-9 pr-2 text-xs outline-none transition focus:border-[#635bff] disabled:bg-zinc-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="appointment-time"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Horário
              </label>

              <input
                id="appointment-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                disabled={pending}
                className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-[#635bff] disabled:bg-zinc-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="appointment-notes"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Observações
            </label>

            <textarea
              id="appointment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={pending}
              rows={3}
              maxLength={500}
              placeholder="Alguma observação sobre o atendimento..."
              className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-300 focus:border-[#635bff] disabled:bg-zinc-50"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600"
            >
              {error}
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
                  Criar agendamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
