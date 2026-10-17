"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createPublicAppointment,
  getAvailableSlots,
} from "@/actions/public-bookings";

type ServiceItem = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

type BusinessItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  primaryColor: string;
  accentColor: string;
};

type Props = {
  business: BusinessItem;
  services: ServiceItem[];
  initialServiceId: string;
  previewMode?: boolean;
};

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function BookingForm({
  business,
  services,
  initialServiceId,
  previewMode = false,
}: Props) {
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [date, setDate] = useState(todayString);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedService =
    services.find((service) => service.id === serviceId) ?? services[0];

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedTime("");
      setMessage("");

      try {
        const result = await getAvailableSlots(business.id, serviceId, date);

        if (cancelled) return;

        if (result.ok) {
          setSlots(result.slots);
        } else {
          setMessage(result.error || "Não foi possível carregar os horários.");
        }
      } catch {
        if (!cancelled) {
          setMessage("Não foi possível carregar os horários. Tente novamente.");
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    if (serviceId && date) void loadSlots();

    return () => {
      cancelled = true;
    };
  }, [business.id, serviceId, date]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!selectedTime) {
      setMessage("Selecione um horário disponível.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("businessId", business.id);
      formData.set("serviceId", serviceId);
      formData.set("date", date);
      formData.set("startTime", selectedTime);
      formData.set("phone", phone);
      formData.set("notes", notes);

      const result = await createPublicAppointment(formData);

      setMessage(
        result.message || result.error || "Não foi possível concluir.",
      );
      setSuccess(result.ok);

      if (result.ok) {
        setSelectedTime("");
        setNotes("");
        // Atualiza a lista de horários depois de reservar.
        const refreshed = await getAvailableSlots(business.id, serviceId, date);
        if (refreshed.ok) setSlots(refreshed.slots);
      }
    } catch {
      setMessage("Ocorreu um erro. Confira os dados e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl"
            style={{
              backgroundColor: `${business.accentColor}22`,
              color: business.accentColor,
            }}
            aria-hidden="true"
          >
            ✦
          </div>
          <div>
            <p className="text-sm text-slate-400">Você está agendando em</p>
            <h2 className="mt-1 text-xl font-semibold">{business.name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              Escolha o serviço, a data e um dos horários disponíveis.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Serviço
            </span>
            <select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              required
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {currency(service.price)} ·{" "}
                  {service.duration} min
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Data
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </label>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Horários disponíveis</h3>
            {loadingSlots && (
              <span className="text-xs text-slate-400">Consultando...</span>
            )}
          </div>

          {loadingSlots ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-11 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          ) : slots.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const active = selectedTime === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-cyan-400 bg-cyan-400 text-slate-950"
                        : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-cyan-400/60 hover:bg-white/[0.07]"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
              {message ||
                "Nenhum horário disponível nesta data. Experimente outro dia."}
            </p>
          )}
        </div>

        <div className="mt-7 grid gap-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Telefone para contato
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              minLength={8}
              maxLength={30}
              autoComplete="tel"
              placeholder="(21) 99999-9999"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Observações{" "}
              <span className="font-normal text-slate-500">(opcional)</span>
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Alguma informação para o estabelecimento?"
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
            />
          </label>
        </div>

        {message && (slots.length > 0 || success) && (
          <p
            role="status"
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              success
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
            }`}
          >
            {message}
          </p>
        )}
        {previewMode && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"
          >
            Você está visualizando a experiência do cliente. Nenhuma reserva
            será criada neste modo.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || loadingSlots || !selectedTime || previewMode}
          className="mt-6 w-full rounded-xl px-5 py-3.5 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: business.accentColor }}
        >
          {previewMode
            ? "Pré-visualização — reserva desativada"
            : submitting
              ? "Enviando agendamento..."
              : "Confirmar agendamento"}
        </button>
      </section>

      <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 lg:sticky lg:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Resumo
        </p>
        <h2 className="mt-4 text-lg font-semibold">{selectedService.name}</h2>
        {selectedService.description && (
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {selectedService.description}
          </p>
        )}

        <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Duração</span>
            <span>{selectedService.duration} minutos</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Data</span>
            <span>{date || "Selecione"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Horário</span>
            <span>{selectedTime || "Selecione"}</span>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
          <span className="text-sm text-slate-400">Total</span>
          <span className="text-2xl font-bold">
            {currency(selectedService.price)}
          </span>
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Seus dados serão utilizados para gerenciar este agendamento com o
          estabelecimento.
        </p>
      </aside>
    </form>
  );
}
