import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";
import { saveBusinessSettings } from "@/actions/businesses";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import RestaurantTable from "@/models/RestaurantTable";
import { BusinessGalleryManager } from "@/components/dashboard/businesses/BusinessGalleryManager";
import { BusinessAddressFields } from "@/components/dashboard/businesses/BusinessAddressFields";
interface PageProps {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

export default async function BusinessSettingsPage({
  params,
  searchParams,
}: PageProps) {
  const { businessId } = await params;
  const { error, success } = await searchParams;

  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");
  if (!mongoose.isValidObjectId(businessId)) notFound();

  await connectToDatabase();

  const business = await Business.findOne({
    _id: businessId,
    ownerId: user.id,
  }).lean();

  if (!business) notFound();

  const activeServices = await Service.countDocuments({
    businessId: business._id,
    active: true,
  });

  const availability = business.availability ?? {
    workingDays: [1, 2, 3, 4, 5, 6],
    openingTime: "09:00",
    closingTime: "18:00",
    slotIntervalMinutes: 30,
  };

  const booking = business.bookingSettings ?? {
    enabled: false,
    confirmationMode: "manual" as const,
    minAdvanceMinutes: 60,
    maxDaysInAdvance: 60,
  };
  const isRestaurant = business.category === "restaurant";

  const activeTables = isRestaurant
    ? await RestaurantTable.countDocuments({
        businessId: business._id,
        active: true,
      })
    : 0;

  const canPublish = isRestaurant ? activeTables > 0 : activeServices > 0;

  const theme = business.theme ?? {
    template: "default",
    primaryColor: "#0F172A",
    accentColor: "#06B6D4",
  };

  const days = [
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" },
  ];

  return (
    <DashboardLayout
      title="Configurações"
      description={business.name}
      backHref={`/dashboard/negocios/${businessId}`}
      backLabel="Voltar ao negócio"
      showHeader={false}
    >
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/dashboard/negocios/${businessId}`}
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Voltar ao negócio
          </Link>

          <header className="mb-8 mt-6">
            <p className="text-sm font-medium text-cyan-400">
              CONFIGURAÇÕES DO ESTABELECIMENTO
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {business.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isRestaurant
                ? "Configure o funcionamento, o endereço e a página pública do restaurante."
                : "Configure os horários e as regras de agendamento antes de publicar a página do seu negócio."}
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            >
              {error === "invalid" &&
                "Confira os dados informados e tente novamente."}
              {error === "address" && "Informe um CEP válido com 8 números."}
              {error === "tables" &&
                "Cadastre pelo menos uma mesa ativa antes de publicar o restaurante."}
              {error === "days" &&
                "Selecione pelo menos um dia válido de funcionamento."}
              {error === "hours" &&
                "O horário de fechamento deve ser posterior ao de abertura."}
              {error === "services" &&
                "Cadastre pelo menos um serviço ativo antes de publicar."}
              {error === "save" &&
                "Não foi possível salvar as configurações. Tente novamente."}
              {![
                "invalid",
                "days",
                "tables",
                "hours",
                "services",
                "address",
                "save",
              ].includes(error) &&
                "Ocorreu um erro ao processar as configurações."}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
            >
              {success === "publish"
                ? "Negócio publicado! A página pública está habilitada."
                : "Configurações salvas com sucesso."}
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Endereço público</p>
            <p className="mt-1 break-all font-medium text-cyan-300">
              /b/{business.slug}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              O link só ficará acessível publicamente depois que o negócio for
              publicado.
            </p>
          </div>

          <BusinessGalleryManager
            businessId={businessId}
            initialImages={(business.gallery ?? []).map((image) => ({
              url: image.url,
              publicId: image.publicId,
              isCover: image.isCover,
            }))}
          />

          <form action={saveBusinessSettings} className="space-y-6">
            <input type="hidden" name="businessId" value={businessId} />
            <BusinessAddressFields initialAddress={business.address} />
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <h2 className="text-lg font-semibold">Identidade visual</h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Personalize as cores usadas na página pública do seu negócio.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-2 block text-slate-300">
                    Cor principal
                  </span>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 p-2">
                    <input
                      type="color"
                      name="primaryColor"
                      defaultValue={theme.primaryColor}
                      className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <span className="text-xs text-slate-400">
                      Fundo principal da página
                    </span>
                  </div>
                </label>

                <label className="text-sm">
                  <span className="mb-2 block text-slate-300">
                    Cor de destaque
                  </span>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 p-2">
                    <input
                      type="color"
                      name="accentColor"
                      defaultValue={theme.accentColor}
                      className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <span className="text-xs text-slate-400">
                      Botões e elementos destacados
                    </span>
                  </div>
                </label>

                <label className="text-sm sm:col-span-2">
                  <span className="mb-2 block text-slate-300">Estilo</span>
                  <select
                    name="themeTemplate"
                    defaultValue={
                      ["default", "minimal", "bold"].includes(theme.template)
                        ? theme.template
                        : "default"
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                  >
                    <option value="default">Clássico</option>
                    <option value="minimal">Minimalista</option>
                    <option value="bold">Marcante</option>
                  </select>
                </label>
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <h2 className="text-lg font-semibold">Dias de funcionamento</h2>
              <p className="mt-1 text-sm text-slate-400">
                Selecione os dias em que os clientes poderão reservar.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {days.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="workingDays"
                      value={day.value}
                      defaultChecked={availability.workingDays.includes(
                        day.value,
                      )}
                      className="size-4 accent-cyan-400"
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <h2 className="text-lg font-semibold">Horários de atendimento</h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-2 block text-slate-300">Abertura</span>
                  <input
                    type="time"
                    name="openingTime"
                    required
                    defaultValue={availability.openingTime}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-2 block text-slate-300">Fechamento</span>
                  <input
                    type="time"
                    name="closingTime"
                    required
                    defaultValue={availability.closingTime}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                  />
                </label>

                {!isRestaurant && (
                  <label className="text-sm">
                    <span className="mb-2 block text-slate-300">
                      Intervalo dos horários
                    </span>

                    <select
                      name="slotIntervalMinutes"
                      defaultValue={availability.slotIntervalMinutes}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                    >
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="60">60 minutos</option>
                    </select>
                  </label>
                )}
              </div>
            </section>

            {!isRestaurant && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Regras de agendamento</h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-2 block text-slate-300">
                      Antecedência mínima
                    </span>
                    <select
                      name="minAdvanceMinutes"
                      defaultValue={booking.minAdvanceMinutes}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                    >
                      <option value="0">Sem antecedência mínima</option>
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="120">2 horas</option>
                      <option value="1440">24 horas</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="mb-2 block text-slate-300">
                      Agendamentos com até
                    </span>
                    <select
                      name="maxDaysInAdvance"
                      defaultValue={booking.maxDaysInAdvance}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                    >
                      <option value="7">7 dias de antecedência</option>
                      <option value="15">15 dias</option>
                      <option value="30">30 dias</option>
                      <option value="60">60 dias</option>
                      <option value="90">90 dias</option>
                      <option value="180">180 dias</option>
                      <option value="365">365 dias</option>
                    </select>
                  </label>

                  <label className="text-sm sm:col-span-2">
                    <span className="mb-2 block text-slate-300">
                      Confirmação dos agendamentos
                    </span>
                    <select
                      name="confirmationMode"
                      defaultValue={booking.confirmationMode}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                    >
                      <option value="manual">
                        Manual — preciso confirmar cada solicitação
                      </option>
                      <option value="automatic">
                        Automática — confirmar ao reservar
                      </option>
                    </select>
                  </label>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <h2 className="text-lg font-semibold">Publicação</h2>

              {isRestaurant ? (
                activeTables > 0 ? (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Seu restaurante está pronto para ser publicado.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Cadastre pelo menos uma mesa ativa antes de publicar o
                    restaurante.
                  </p>
                )
              ) : activeServices > 0 ? (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Seu negócio está pronto para ser publicado.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Cadastre pelo menos um serviço ativo antes de publicar.
                </p>
              )}

              {isRestaurant ? (
                <Link
                  className="mt-4 inline-flex rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
                  href={`/dashboard/negocios/${businessId}/mesas`}
                >
                  Gerenciar mesas
                </Link>
              ) : (
                <Link
                  className="mt-4 inline-flex rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
                  href={`/dashboard/negocios/${businessId}/servicos`}
                >
                  Gerenciar serviços
                </Link>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  name="intent"
                  value="save"
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5"
                >
                  Salvar configurações
                </button>

                <button
                  type="submit"
                  name="intent"
                  value="publish"
                  disabled={!canPublish}
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Publicar negócio
                </button>
              </div>
            </section>
          </form>
        </div>
      </main>
    </DashboardLayout>
  );
}
