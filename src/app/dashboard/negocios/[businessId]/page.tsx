import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  FiArrowLeft,
  FiSettings,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiArrowUpRight,
  FiGlobe,
  FiClock,
  FiBookOpen,
} from "react-icons/fi";
import mongoose from "mongoose";
import { DeleteBusinessButton } from "@/components/dashboard/businesses/DeleteBusinessButton";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default async function ManageBusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");

  const { businessId } = await params;

  if (!mongoose.isValidObjectId(businessId)) {
    notFound();
  }

  await connectToDatabase();

  const business = await Business.findOne({
    _id: businessId,
    ownerId: user.id,
  })
    .select(
      "name slug category status description timezone theme bookingSettings",
    )
    .lean();

  if (!business) notFound();

  const categories: Record<string, string> = {
    barbershop: "Barbearia",
    beauty_salon: "Salão de beleza",
    restaurant: "Restaurante",
    other: "Outro negócio",
  };

function isRestaurant(category: string) {
  return ["restaurant", "restaurante", "restaurants"].includes(category.trim().toLowerCase());
}

  const basePath = `/dashboard/negocios/${businessId}`;

  const managementItems =
    business.category === "restaurant"
      ? [
          {
            title: "Mesas",
            description:
              "Cadastre mesas, configure capacidades e controle a disponibilidade.",
            href: `${basePath}/mesas`,
            icon: FiUsers,
            label: "Gerenciar mesas",
          },
          {
            title: "Fila de espera",
            description:
              "Organize os grupos aguardando atendimento e acompanhe a fila.",
            href: `${basePath}/fila-de-espera`,
            icon: FiClock,
            label: "Abrir fila",
          },
          {
            title: "Menu digital",
            description:
              "Publique categorias e itens do cardápio para seus clientes.",
            href: `${basePath}/menu`,
            icon: FiBookOpen,
            label: "Editar menu digital",
          },
          {
            title: "Configurações",
            description:
              "Configure o funcionamento e a publicação do restaurante.",
            href: `${basePath}/configuracoes`,
            icon: FiSettings,
            label: "Configurar restaurante",
          },
        ]
      : [
          {
            title: "Agenda",
            description:
              "Consulte os horários, crie agendamentos e organize seus atendimentos.",
            href: `${basePath}/agenda`,
            icon: FiCalendar,
            label: "Abrir agenda",
          },
          {
            title: "Serviços",
            description:
              "Gerencie os serviços oferecidos, a duração e os preços.",
            href: `${basePath}/servicos`,
            icon: FiBriefcase,
            label: "Gerenciar serviços",
          },
          {
            title: "Clientes",
            description:
              "Consulte e organize os clientes cadastrados neste negócio.",
            href: `${basePath}/clientes`,
            icon: FiUsers,
            label: "Gerenciar clientes",
          },
          {
            title: "Configurações",
            description:
              "Prepare as regras de reserva, o fuso horário e as preferências.",
            href: `${basePath}/configuracoes`,
            icon: FiSettings,
            label: "Configurar negócio",
          },
        ];

  return (
    <DashboardLayout
      title="Gestão do negócio"
      description={business.name}
      businessCategory={business.category}
      backHref="/dashboard/negocios"
      backLabel="Meus negócios"
      showHeader={false}
      contentVariant="dark"
      fullBleed
    >
      <main className="min-h-full bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard/negocios"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <FiArrowLeft />
            Meus negócios
          </Link>

          <header className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-400">
                {categories[business.category] ?? "Negócio"}
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {business.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Gerencie sua operação, organize os atendimentos e configure a
                experiência dos seus clientes.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
              <span
                className={`size-2 rounded-full ${
                  business.status === "active"
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              {business.status === "active"
                ? "Ativo"
                : business.status === "suspended"
                  ? "Suspenso"
                  : "Em configuração"}
            </span>
          </header>

          <section className="mt-9">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Gerenciar negócio</h2>
              <p className="mt-1 text-sm text-slate-400">
                Escolha uma área para continuar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {managementItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex min-h-56 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 transition group-hover:bg-cyan-400/15">
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-5 flex items-center justify-between gap-2 font-semibold">
                      {item.title}
                      <FiArrowUpRight
                        className="text-slate-500 transition group-hover:text-cyan-400"
                        size={18}
                      />
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>

                    <span className="mt-auto pt-5 text-sm font-medium text-cyan-400">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <FiGlobe size={20} />
                </div>

                <div>
                  <h2 className="font-semibold">Página pública</h2>
                  <p className="text-xs text-slate-400">
                    Endereço e acesso dos clientes
                  </p>
                </div>
              </div>

              <p className="mt-4 break-all text-sm text-cyan-400">
                /b/{business.slug}
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <FiClock size={14} />
                Fuso horário: {business.timezone || "Não configurado"}
              </div>

              {business.category !== "restaurant" && (
                <p className="mt-2 text-xs text-slate-500">
                  Reservas públicas:{" "}
                  {business.bookingSettings?.enabled ? "Ativadas" : "Desativadas"}
                </p>
              )}

              {business.status === "active" ? (
                <Link
                  href={`/b/${business.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Visualizar página pública
                  <FiArrowUpRight size={16} />
                </Link>
              ) : (
                <Link
                  href={`${basePath}/configuracoes`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                >
                  Configurar e publicar
                  <FiSettings size={16} />
                </Link>
              )}

              {business.status === "active" &&
                (isRestaurant(business.category) ? (
                  <Link
                    href={`/b/${business.slug}/fila`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Visualizar fila de espera
                    <FiClock size={16} />
                  </Link>
                ) : business.bookingSettings?.enabled ? (
                  <Link
                    href={`/b/${business.slug}/agendar?preview=1`}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Pré-visualizar agendamento
                    <FiCalendar size={16} />
                  </Link>
                ) : null)}
            </div>
          </section>
          <section className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[0.03] p-5 sm:p-6">
            <h2 className="font-semibold text-red-300">Zona de perigo</h2>
            <p className="mt-2 mb-4 text-sm leading-6 text-slate-400">
              A exclusão remove este estabelecimento e os registros
              relacionados. Ela não exclui a sua conta no AgendaFlow.
            </p>

            <DeleteBusinessButton
              businessId={businessId}
              businessName={business.name}
            />
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}
