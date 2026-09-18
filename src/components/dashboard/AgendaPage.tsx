"use client";

import { useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
} from "react-icons/fi";

import { DashboardLayout } from "./DashboardLayout";

const appointments = [
  {
    time: "09:00",
    name: "João Martins",
    service: "Corte de cabelo",
    professional: "Lucas Almeida",
    status: "Confirmado",
  },
  {
    time: "10:30",
    name: "Mariana Costa",
    service: "Coloração",
    professional: "Bruno Martins",
    status: "Confirmado",
  },
  {
    time: "13:00",
    name: "Pedro Alves",
    service: "Barba",
    professional: "Rafael Costa",
    status: "Aguardando",
  },
  {
    time: "14:30",
    name: "Ana Souza",
    service: "Corte + Barba",
    professional: "Lucas Almeida",
    status: "Confirmado",
  },
  {
    time: "16:00",
    name: "Carlos Lima",
    service: "Corte de cabelo",
    professional: "Rafael Costa",
    status: "Confirmado",
  },
];

export function AgendaPage() {
  const [view, setView] = useState<"dia" | "semana">("dia");

  return (
    <DashboardLayout
      title="Agenda"
      description="Acompanhe e organize seus atendimentos."
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            >
              <FiChevronLeft size={15} />
            </button>

            <div className="min-w-32 text-center">
              <p className="text-sm font-semibold text-zinc-900">20 Setembro</p>

              <p className="text-[10px] text-zinc-400">Segunda-feira</p>
            </div>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            >
              <FiChevronRight size={15} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-zinc-200 p-1">
              {(["dia", "semana"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-medium capitalize ${
                    view === item ? "bg-zinc-900 text-white" : "text-zinc-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-xl bg-[#635bff] px-3 text-xs font-semibold text-white hover:bg-[#5148e8]"
            >
              <FiPlus size={14} />
              Agendamento
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <div className="flex items-center gap-2">
              <FiCalendar size={16} className="text-[#635bff]" />

              <h2 className="text-sm font-semibold text-zinc-900">
                Atendimentos do dia
              </h2>

              <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500">
                {appointments.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {appointments.map((appointment) => (
              <div
                key={`${appointment.time}-${appointment.name}`}
                className="grid gap-4 p-5 sm:grid-cols-[70px_1fr_auto] sm:items-center"
              >
                <span className="text-xs font-semibold text-zinc-400">
                  {appointment.time}
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#635bff]/10 text-xs font-semibold text-[#635bff]">
                    {appointment.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-800">
                      {appointment.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      {appointment.service} · {appointment.professional}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    appointment.status === "Confirmado"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
