"use client";

import { useEffect, useState } from "react";
import { getBusinessAppointments } from "@/actions/business-agenda";

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
  businessId: string;
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

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekDates(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  const weekday = date.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;

  date.setDate(date.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(date);
    current.setDate(date.getDate() + index);

    return getLocalDateString(current);
  });
}

export function AgendaPage({ businessId, clients, services }: AgendaPageProps) {
  const [weekAppointments, setWeekAppointments] = useState<AppointmentData[]>(
    [],
  );
  const [loadingWeek, setLoadingWeek] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);

  const [view, setView] = useState<"dia" | "semana">("dia");

  const [selectedDate, setSelectedDate] = useState(() =>
    getLocalDateString(new Date()),
  );

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [agendaError, setAgendaError] = useState("");

  const weekDates = getWeekDates(selectedDate);

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      setLoadingAppointments(true);
      setAgendaError("");

      try {
        const result = await getBusinessAppointments(businessId, selectedDate);

        if (cancelled) return;

        if (result.ok) {
          setAppointments(result.appointments);
        } else {
          setAppointments([]);
          setAgendaError(result.error ?? "Não foi possível carregar a agenda.");
        }
      } catch {
        if (!cancelled) {
          setAppointments([]);
          setAgendaError("Erro ao carregar a agenda. Tente novamente.");
        }
      } finally {
        if (!cancelled) setLoadingAppointments(false);
      }
    }

    async function loadWeek() {
      setLoadingWeek(true);

      try {
        const results = await Promise.all(
          weekDates.map((date) => getBusinessAppointments(businessId, date)),
        );

        if (cancelled) return;

        const allAppointments = results.flatMap((result) =>
          result.ok ? result.appointments : [],
        );

        setWeekAppointments(
          allAppointments.sort((a, b) => {
            const dateComparison = a.date.localeCompare(b.date);

            return dateComparison || a.startTime.localeCompare(b.startTime);
          }),
        );
      } catch {
        if (!cancelled) setWeekAppointments([]);
      } finally {
        if (!cancelled) setLoadingWeek(false);
      }
    }

    void loadAppointments();
    void loadWeek();
    return () => {
      cancelled = true;
    };
  }, [businessId, selectedDate]);
  function changeDate(days: number) {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    setSelectedDate(getLocalDateString(date));
  }
  async function refreshAgenda() {
    setAgendaError("");

    try {
      const [dayResult, weekResults] = await Promise.all([
        getBusinessAppointments(businessId, selectedDate),
        Promise.all(
          weekDates.map((date) => getBusinessAppointments(businessId, date)),
        ),
      ]);

      if (dayResult.ok) {
        setAppointments(dayResult.appointments);
      } else {
        setAgendaError(
          dayResult.error ?? "Não foi possível atualizar a agenda.",
        );
      }

      const allAppointments = weekResults.flatMap((result) =>
        result.ok ? result.appointments : [],
      );

      setWeekAppointments(
        allAppointments.sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.startTime.localeCompare(b.startTime),
        ),
      );
    } catch {
      setAgendaError("Não foi possível atualizar os agendamentos.");
    }
  }

  return (
    <>
      <DashboardLayout
        title="Agenda"
        description="Acompanhe e organize seus atendimentos."
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeDate(view === "semana" ? -7 : -1)}
                aria-label={
                  view === "semana" ? "Semana anterior" : "Dia anterior"
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <FiChevronLeft size={17} />
              </button>

              <div className="min-w-0 flex-1 text-center sm:min-w-40">
                <p className="text-sm font-semibold capitalize text-zinc-900">
                  {view === "semana"
                    ? `${formatDateLabel(weekDates[0])} – ${formatDateLabel(weekDates[6])}`
                    : formatDateLabel(selectedDate)}
                </p>
                <p className="mt-1 text-xs capitalize text-zinc-500">
                  {view === "semana"
                    ? "Visão semanal"
                    : formatWeekday(selectedDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => changeDate(view === "semana" ? 7 : 1)}
                aria-label={
                  view === "semana" ? "Próxima semana" : "Próximo dia"
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <FiChevronRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(getLocalDateString(new Date()))}
                className="hidden rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:block"
              >
                Hoje
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex rounded-xl border border-zinc-200 bg-zinc-50 p-1"
                aria-label="Visualização da agenda"
              >
                {(["dia", "semana"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setView(item)}
                    aria-pressed={view === item}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${
                      view === item
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5148e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:flex-none"
              >
                <FiPlus size={15} />
                Novo agendamento
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 p-5">
              <div className="flex items-center gap-2">
                <FiCalendar size={17} className="text-[#635bff]" />
                <h2 className="text-sm font-semibold text-zinc-900">
                  {view === "semana"
                    ? "Agendamentos da semana"
                    : "Agendamentos do dia"}
                </h2>
              </div>

              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                {view === "semana"
                  ? weekAppointments.length
                  : appointments.length}
              </span>
            </div>

            {view === "dia" ? (
              <div className="divide-y divide-zinc-100">
                {loadingAppointments && (
                  <p className="px-5 py-10 text-center text-sm text-zinc-500">
                    Carregando agendamentos...
                  </p>
                )}

                {!loadingAppointments && agendaError && (
                  <div
                    role="alert"
                    className="px-5 py-8 text-center text-sm text-red-600"
                  >
                    {agendaError}
                  </div>
                )}

                {!loadingAppointments &&
                  !agendaError &&
                  appointments.length === 0 && (
                    <div className="px-5 py-12 text-center">
                      <FiCalendar size={24} className="mx-auto text-zinc-300" />
                      <p className="mt-3 text-sm font-semibold text-zinc-800">
                        Nenhum atendimento neste dia
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Os novos agendamentos aparecerão aqui.
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#5148e8]"
                      >
                        <FiPlus size={14} />
                        Criar agendamento
                      </button>
                    </div>
                  )}

                {!loadingAppointments &&
                  !agendaError &&
                  appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="grid gap-3 p-5 sm:grid-cols-[70px_1fr_auto] sm:items-center"
                    >
                      <span className="text-sm font-semibold text-zinc-500">
                        {appointment.startTime}
                      </span>

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#635bff]/10 text-xs font-semibold text-[#635bff]">
                          {appointment.client.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-800">
                            {appointment.client.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {appointment.service.name} ·{" "}
                            {appointment.service.duration} min
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Até {appointment.endTime}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(appointment.status)}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div>
                {loadingWeek ? (
                  <p className="px-5 py-10 text-center text-sm text-zinc-500">
                    Carregando a semana...
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {weekDates.map((date) => {
                      const dayAppointments = weekAppointments.filter(
                        (appointment) => appointment.date === date,
                      );

                      return (
                        <section key={date}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(date);
                              setView("dia");
                            }}
                            className="flex w-full items-center justify-between gap-3 bg-zinc-50/80 px-5 py-3 text-left transition hover:bg-zinc-100"
                          >
                            <span className="text-xs font-semibold capitalize text-zinc-800">
                              {formatWeekday(date)}, {formatDateLabel(date)}
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                              {dayAppointments.length}{" "}
                              {dayAppointments.length === 1
                                ? "agendamento"
                                : "agendamentos"}
                            </span>
                          </button>

                          {dayAppointments.length === 0 ? (
                            <p className="px-5 py-4 text-xs text-zinc-400">
                              Nenhum atendimento programado.
                            </p>
                          ) : (
                            <div className="divide-y divide-zinc-100">
                              {dayAppointments.map((appointment) => (
                                <div
                                  key={appointment._id}
                                  className="grid gap-3 px-5 py-4 sm:grid-cols-[70px_1fr_auto] sm:items-center"
                                >
                                  <span className="text-sm font-semibold text-zinc-500">
                                    {appointment.startTime}
                                  </span>

                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#635bff]/10 text-xs font-semibold text-[#635bff]">
                                      {appointment.client.name
                                        .split(" ")
                                        .map((part) => part[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-zinc-800">
                                        {appointment.client.name}
                                      </p>
                                      <p className="mt-1 text-xs text-zinc-500">
                                        {appointment.service.name} ·{" "}
                                        {appointment.service.duration} min
                                      </p>
                                    </div>
                                  </div>

                                  <span
                                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(appointment.status)}`}
                                  >
                                    {getStatusLabel(appointment.status)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      <AppointmentModal
        businessId={businessId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        services={services}
        selectedDate={selectedDate}
        onCreated={async () => {
          await refreshAgenda();
          setModalOpen(false);
        }}
      />
    </>
  );
}
