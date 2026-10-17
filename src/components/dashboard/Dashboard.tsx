import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FiArrowUpRight,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiPlus,
  FiScissors,
  FiUsers,
} from "react-icons/fi";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Business from "@/models/Business";
import Client from "@/models/Client";
import Service from "@/models/Service";
import { DashboardLayout } from "./DashboardLayout";

function getTodayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
};

export async function Dashboard() {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");

  await connectToDatabase();

  const businesses = await Business.find({ ownerId: user.id })
    .select("_id name slug status")
    .sort({ createdAt: -1 })
    .lean();

  const businessIds = businesses.map((business) => business._id);
  const today = getTodayInSaoPaulo();
  const startOfToday = new Date(`${today}T00:00:00.000Z`);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  let todayCount = 0;
  let activeClients = 0;
  let activeServices = 0;

  type AppointmentRow = {
    _id: { toString(): string };
    date: Date;
    startTime: string;
    endTime: string;
    status: string;
    clientId: { name: string } | null;
    serviceId: { name: string } | null;
    businessId: {
      _id: { toString(): string };
      name: string;
    } | null;
  };

  let todayAppointments: AppointmentRow[] = [];
  let upcomingAppointments: AppointmentRow[] = [];

  if (businessIds.length > 0) {
    const businessFilter = { $in: businessIds };

    const [count, clients, services, todayRows, upcomingRows] =
      await Promise.all([
        Appointment.countDocuments({
          businessId: businessFilter,
          date: { $gte: startOfToday, $lt: startOfTomorrow },
          status: { $ne: "cancelled" },
        }),
        Client.countDocuments({
          businessId: businessFilter,
          active: true,
        }),
        Service.countDocuments({
          businessId: businessFilter,
          active: true,
        }),
        Appointment.find({
          businessId: businessFilter,
          date: { $gte: startOfToday, $lt: startOfTomorrow },
          status: { $ne: "cancelled" },
        })
          .populate({ path: "clientId", select: "name" })
          .populate({ path: "serviceId", select: "name" })
          .populate({ path: "businessId", select: "name" })
          .sort({ startTime: 1 })
          .limit(8)
          .lean(),
        Appointment.find({
          businessId: businessFilter,
          date: { $gte: startOfTomorrow },
          status: { $nin: ["cancelled", "completed"] },
        })
          .populate({ path: "clientId", select: "name" })
          .populate({ path: "serviceId", select: "name" })
          .populate({ path: "businessId", select: "name" })
          .sort({ date: 1, startTime: 1 })
          .limit(6)
          .lean(),
      ]);

    todayCount = count;
    activeClients = clients;
    activeServices = services;
    todayAppointments = todayRows as unknown as AppointmentRow[];
    upcomingAppointments = upcomingRows as unknown as AppointmentRow[];
  }

  const stats = [
    {
      label: "Agendamentos hoje",
      value: todayCount,
      icon: FiCalendar,
    },
    {
      label: "Clientes ativos",
      value: activeClients,
      icon: FiUsers,
    },
    {
      label: "Serviços ativos",
      value: activeServices,
      icon: FiScissors,
    },
    {
      label: "Negócios cadastrados",
      value: businesses.length,
      icon: FiBriefcase,
    },
  ];

  return (
    <DashboardLayout
      title="Visão geral"
      description="Acompanhe os dados reais dos seus negócios."
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Bem-vindo, {user.name}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
            Visão geral
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Um resumo atualizado da sua operação.
          </p>
        </div>

        <Link
          href="/dashboard/negocios"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5148e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <FiPlus size={17} />
          {businesses.length === 0 ? "Criar meu negócio" : "Gerenciar negócios"}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
                <Icon size={18} />
              </div>
              <p className="mt-5 text-xs text-zinc-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
                {stat.value}
              </p>
            </article>
          );
        })}
      </div>

      {businesses.length === 0 ? (
        <section className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <FiBriefcase size={28} className="mx-auto text-zinc-400" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900">
            Vamos configurar seu primeiro negócio?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Cadastre o estabelecimento, adicione os serviços e configure os
            horários para começar a receber reservas.
          </p>
          <Link
            href="/dashboard/negocios/novo"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5148e8]"
          >
            Criar negócio
            <FiArrowUpRight size={16} />
          </Link>
        </section>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Agenda de hoje
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {dateFormatter.format(startOfToday)}
                </p>
              </div>
              <FiCalendar className="text-[#635bff]" size={18} />
            </header>

            {todayAppointments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <FiClock size={22} className="mx-auto text-zinc-300" />
                <p className="mt-3 text-sm font-medium text-zinc-700">
                  Nenhum agendamento para hoje
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Os novos atendimentos aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {todayAppointments.map((appointment) => {
                  const client = appointment.clientId;
                  const service = appointment.serviceId;
                  const business = appointment.businessId;

                  return (
                    <div
                      key={appointment._id.toString()}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      <span className="w-12 shrink-0 text-xs font-semibold text-zinc-500">
                        {appointment.startTime}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800">
                          {client?.name ?? "Cliente indisponível"}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {service?.name ?? "Serviço indisponível"}
                          {business ? ` · ${business.name}` : ""}
                        </p>
                      </div>
                      <span className="hidden rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-600 sm:inline-flex">
                        {statusLabels[appointment.status] ?? appointment.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <header className="border-b border-zinc-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-zinc-900">
                Próximos agendamentos
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Reservas futuras registradas
              </p>
            </header>

            {upcomingAppointments.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-zinc-500">
                Nenhum agendamento futuro encontrado.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {upcomingAppointments.map((appointment) => {
                  const client = appointment.clientId;
                  const service = appointment.serviceId;
                  const business = appointment.businessId;

                  return (
                    <div
                      key={appointment._id.toString()}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800">
                          {client?.name ?? "Cliente indisponível"}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {service?.name ?? "Serviço indisponível"}
                          {business ? ` · ${business.name}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-zinc-700">
                          {dateFormatter.format(new Date(appointment.date))}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {appointment.startTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {businesses.length > 0 && (
        <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Seus negócios</h3>
          <div className="mt-3 divide-y divide-zinc-100">
            {businesses.map((business) => (
              <Link
                key={business._id.toString()}
                href={`/dashboard/negocios/${business._id.toString()}`}
                className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-[#635bff]"
              >
                <span className="truncate font-medium text-zinc-800">
                  {business.name}
                </span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {business.status === "active"
                    ? "Ativo"
                    : business.status === "suspended"
                      ? "Suspenso"
                      : "Em configuração"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}
