"use client";

import { useState } from "react";
import {
  cancelClientAppointment,
  rescheduleClientAppointment,
} from "@/actions/client-appointments";
import { getAvailableSlots } from "@/actions/public-bookings";

type Props = {
  appointmentId: string;
  businessId: string;
  serviceId: string;
  date: string;
  startTime: string;
};

export function ClientAppointmentActions({
  appointmentId,
  businessId,
  serviceId,
  date: initialDate,
  startTime,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(initialDate.slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState(startTime);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSlots(nextDate: string) {
    setDate(nextDate);
    setTime("");
    setSlots([]);
    setMessage("");

    if (!nextDate) return;

    setLoading(true);

    try {
      const result = await getAvailableSlots(businessId, serviceId, nextDate);

      if (result.ok) {
        setSlots(result.slots);
      } else {
        setMessage(result.error || "Não foi possível consultar os horários.");
      }
    } catch {
      setMessage("Erro ao consultar horários.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Tem certeza de que deseja cancelar este agendamento?",
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await cancelClientAppointment(appointmentId);

      if (!result.success) {
        setMessage(result.error || "Não foi possível cancelar.");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule() {
    if (!date || !time) {
      setMessage("Selecione uma data e um horário.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await rescheduleClientAppointment({
        appointmentId,
        date,
        startTime: time,
      });

      if (!result.success) {
        setMessage(result.error || "Não foi possível reagendar.");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      {!editing ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => setEditing(true)}
            className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            Reagendar
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            className="rounded-xl border border-rose-400/30 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-400/10 disabled:opacity-50"
          >
            Cancelar agendamento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Nova data
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => void loadSlots(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">
              Horários disponíveis
            </p>

            {loading ? (
              <p className="text-sm text-slate-400">Consultando horários...</p>
            ) : slots.length ? (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={time === slot}
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      time === slot
                        ? "border-cyan-400 bg-cyan-400 text-slate-950"
                        : "border-white/10 text-white hover:border-cyan-400"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Escolha uma data para consultar os horários disponíveis.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading || !date || !time}
              onClick={handleReschedule}
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Confirmar novo horário
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setMessage("");
              }}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 text-sm text-amber-300">
          {message}
        </p>
      )}
    </div>
  );
}
