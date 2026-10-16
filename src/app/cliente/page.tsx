import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FiCalendar,
  FiClock,
  FiArrowUpRight,
  FiMapPin,
  FiSearch,
} from "react-icons/fi";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Appointment } from "@/models/Appointment";
import Client from "@/models/Client";
import Business from "@/models/Business";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const categoryLabels: Record<string, string> = {
  barbershop: "Barbearia",
  beauty_salon: "Salão de beleza",
  restaurant: "Restaurante",
  other: "Estabelecimento",
};

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(date));
}

export default async function ClientPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "client") redirect("/dashboard");

  await connectToDatabase();

  // Só consideramos cadastros explicitamente associados
  // à conta autenticada.
  const clientProfiles = await Client.find({
    accountUserId: user.id,
    active: true,
  })
    .select("_id businessId")
    .lean();

  const clientIds = clientProfiles.map((client) => client._id);

  const [appointments, businesses] = await Promise.all([
    clientIds.length > 0
      ? Appointment.find({
          clientId: { $in: clientIds },
        })
          .populate("serviceId", "name duration price")
          .populate("businessId", "name slug category")
          .sort({ date: -1, startTime: -1 })
          .limit(100)
          .lean()
      : Promise.resolve([]),

    Business.find({
      status: "active",
      "bookingSettings.enabled": true,
    })
      .select("name slug category description")
      .sort({ name: 1 })
      .limit(12)
      .lean(),
  ]);

  const serializedAppointments = appointments.map((appointment) => {
    const service = appointment.serviceId as unknown as {
      name: string;
      duration: number;
      price: number;
    } | null;

    const business = appointment.businessId as unknown as {
      name: string;
      slug: string;
      category: string;
    } | null;

    return {
      id: appointment._id.toString(),
      date: appointment.date.toISOString(),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      serviceName: service?.name ?? "Serviço indisponível",
      businessName: business?.name ?? "Estabelecimento",
      businessSlug: business?.slug ?? null,
      category: business?.category ?? "other",
    };
  });

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = serializedAppointments
    .filter(
      (appointment) =>
        appointment.status !== "cancelled" &&
        appointment.status !== "completed" &&
        appointment.date.slice(0, 10) >= today,
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    );

  const history = serializedAppointments.filter(
    (appointment) =>
      appointment.status === "completed" ||
      appointment.status === "cancelled" ||
      appointment.date.slice(0, 10) < today,
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-cyan-400">
              AGENDAFLOW · ÁREA DO CLIENTE
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Olá, {user.name}!
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Seus compromissos, organizados em um só lugar.
            </p>
          </div>

          <Link
            href="#estabelecimentos"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <FiSearch size={17} />
            Encontrar estabelecimento
          </Link>
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
              <FiCalendar size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">Próximos agendamentos</h2>
              <p className="text-sm text-slate-400">
                {upcoming.length} compromisso(s) futuro(s)
              </p>
            </div>
          </div>

          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <FiCalendar size={30} className="mx-auto text-slate-500" />

              <h3 className="mt-4 text-lg font-semibold">
                Nenhum agendamento por enquanto
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Explore os estabelecimentos disponíveis e descubra onde você
                poderá agendar seu próximo atendimento.
              </p>

              <Link
                href="#estabelecimentos"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Explorar estabelecimentos
                <FiArrowUpRight size={17} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-cyan-400">
                        {appointment.businessName}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {appointment.serviceName}
                      </h3>
                    </div>

                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {statusLabels[appointment.status] ?? appointment.status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-400">
                    <p className="flex items-center gap-2">
                      <FiCalendar className="text-cyan-400" />
                      {formatDate(appointment.date)}
                    </p>

                    <p className="flex items-center gap-2">
                      <FiClock className="text-cyan-400" />
                      {appointment.startTime} – {appointment.endTime}
                    </p>
                  </div>

                  {appointment.businessSlug && (
                    <Link
                      href={`/b/${appointment.businessSlug}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      Ver estabelecimento
                      <FiArrowUpRight size={16} />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Histórico</h2>
          <p className="mt-1 text-sm text-slate-400">
            Seus atendimentos anteriores e agendamentos cancelados.
          </p>

          {history.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-slate-400">
              Seu histórico aparecerá aqui quando houver agendamentos.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
              {history.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{appointment.serviceName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {appointment.businessName} ·{" "}
                      {formatDate(appointment.date)} · {appointment.startTime}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    {statusLabels[appointment.status] ?? appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="estabelecimentos" className="mt-12 scroll-mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Descubra estabelecimentos</h2>
            <p className="mt-1 text-sm text-slate-400">
              Conheça os negócios disponíveis no AgendaFlow.
            </p>
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <FiMapPin size={24} className="text-cyan-400" />
              <p className="mt-3 font-medium">
                Ainda não há estabelecimentos disponíveis.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Os negócios aparecerão aqui quando estiverem ativos e
                habilitarem as reservas públicas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <article
                  key={business._id.toString()}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                    <FiMapPin size={21} />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">
                    {business.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {categoryLabels[business.category] ?? "Estabelecimento"}
                  </p>

                  {business.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                      {business.description}
                    </p>
                  )}

                  <Link
                    href={`/b/${business.slug}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Conhecer estabelecimento
                    <FiArrowUpRight size={17} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
