"use client";

import { useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
} from "react-icons/fi";

import { AppointmentModal } from "./AppointmentModal";
import { DashboardLayout } from "./DashboardLayout";

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

type AppointmentData = {
  _id: string;
  client: ClientOption;
  service: ServiceOption;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
};

interface AgendaPageProps {
  clients: ClientOption[];
  services: ServiceOption[];
}

function formatDateLabel(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  }).format(parsedDate);
}

function formatWeekday(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(parsedDate);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    scheduled: "bg-amber-50 text-amber-600",
    confirmed: "bg-emerald-50 text-emerald-600",
    completed: "bg-blue-50 text-blue-600",
    cancelled: "bg-red-50 text-red-600",
  };

  return classes[status] ?? "bg-zinc-100 text-zinc-500";
}

export function AgendaPage({ clients, services }: AgendaPageProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);

  const [view, setView] = useState<"dia" | "semana">("dia");

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();

    return today.toISOString().split("T")[0];
  });

  function changeDate(days: number) {
    const date = new Date(`${selectedDate}T00:00:00`);

    date.setDate(date.getDate() + days);

    setSelectedDate(date.toISOString().split("T")[0]);
  }

  return (
    <>
      <DashboardLayout
        title="Agenda"
        description="Acompanhe e organize seus atendimentos."
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeDate(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50"
                aria-label="Dia anterior"
              >
                <FiChevronLeft size={15} />
              </button>

              <div className="min-w-32 text-center">
                <p className="text-sm font-semibold capitalize text-zinc-900">
                  {formatDateLabel(selectedDate)}
                </p>

                <p className="text-[10px] capitalize text-zinc-400">
                  {formatWeekday(selectedDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => changeDate(1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50"
                aria-label="Próximo dia"
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
                onClick={() => setModalOpen(true)}
                className="flex h-9 items-center gap-2 rounded-xl bg-[#635bff] px-3 text-xs font-semibold text-white transition hover:bg-[#5148e8]"
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
                  key={appointment._id}
                  className="grid gap-4 p-5 sm:grid-cols-[70px_1fr_auto] sm:items-center"
                >
                  <span className="text-xs font-semibold text-zinc-400">
                    {appointment.startTime}
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#635bff]/10 text-xs font-semibold text-[#635bff]">
                      {appointment.client.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        {appointment.client.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        {appointment.service.name} ·{" "}
                        {appointment.service.duration} min
                      </p>
                    </div>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                      appointment.status,
                    )}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              ))}

              {appointments.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <FiCalendar size={22} className="mx-auto text-zinc-300" />

                  <p className="mt-3 text-sm font-medium text-zinc-700">
                    Nenhum atendimento
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Não existem agendamentos para este dia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        services={services}
        selectedDate={selectedDate}
        onCreated={(appointment) => {
          setAppointments((currentAppointments) => [
            ...currentAppointments,
            appointment,
          ]);
        }}
      />
    </>
  );
}
