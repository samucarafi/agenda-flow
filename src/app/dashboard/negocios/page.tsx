import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FiArrowUpRight,
  FiPlus,
  FiScissors,
  FiBriefcase,
  FiCoffee,
} from "react-icons/fi";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";

const categoryLabels: Record<string, string> = {
  barbershop: "Barbearia",
  beauty_salon: "Salão de beleza",
  restaurant: "Restaurante",
  other: "Outro negócio",
};

const statusLabels: Record<string, string> = {
  draft: "Em configuração",
  active: "Ativo",
  suspended: "Suspenso",
};

function isRestaurant(category: string) {
  return ["restaurant", "restaurante", "restaurants"].includes(category.trim().toLowerCase());
}

function CategoryIcon({ category }: { category: string }) {
  if (category === "barbershop" || category === "beauty_salon") {
    return <FiScissors size={22} />;
  }

  if (category === "restaurant") {
    return <FiCoffee size={22} />;
  }

  return <FiBriefcase size={22} />;
}

export default async function BusinessesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (user.role !== "owner") {
    redirect("/cliente");
  }

  await connectToDatabase();

  const businesses = await Business.find({
    ownerId: user.id,
  })
    .select("name slug category status description createdAt gallery")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <DashboardLayout
      title="Meus negócios"
      description="Gerencie seus estabelecimentos."
      showHeader={false}
      contentVariant="dark"
    >
      <div className="px-1 py-2 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-700">
                ESPAÇO DE TRABALHO
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Meus negócios
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Gerencie seus estabelecimentos e personalize cada experiência de
                atendimento.
              </p>
            </div>

            <Link
              href="/dashboard/negocios/novo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <FiPlus size={18} />
              Novo negócio
            </Link>
          </header>

          {businesses.length === 0 ? (
            <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <FiBriefcase size={26} />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                Seu primeiro negócio começa aqui
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Cadastre sua barbearia, salão ou restaurante para começar a
                configurar seus serviços e suas reservas.
              </p>

              <Link
                href="/dashboard/negocios/novo"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Criar meu primeiro negócio
                <FiArrowUpRight size={18} />
              </Link>
            </section>
          ) : (
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {businesses.map((business) => (
                <article
                  key={business._id.toString()}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  {(() => {
                    const cover =
                      business.gallery?.find((image) => image.isCover)?.url ??
                      business.gallery?.[0]?.url;

                    return cover ? (
                      <div className="mb-4 aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={cover}
                          alt={`Capa de ${business.name}`}
                          width={1200}
                          height={675}
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null;
                  })()}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <CategoryIcon category={business.category} />
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                      {statusLabels[business.status] ?? "Indefinido"}
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    {business.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {categoryLabels[business.category] ?? "Outro negócio"}
                  </p>

                  {business.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {business.description}
                    </p>
                  )}

                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500">Página pública</p>

                    <Link
                      href={`/b/${business.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 break-all text-sm font-medium text-indigo-700 hover:text-indigo-900"
                    >
                      /b/{business.slug}
                      <FiArrowUpRight size={16} />
                    </Link>

                    {business.status === "active" ? (
                      <Link
                        href={isRestaurant(business.category) ? `/dashboard/negocios/${business._id.toString()}/fila-de-espera` : `/b/${business.slug}/agendar?preview=1`}
                        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        {isRestaurant(business.category) ? "Gerenciar fila de espera" : "Pré-visualizar agendamento"}
                        <FiArrowUpRight size={16} />
                      </Link>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">
                        Ative o negócio para disponibilizar a página pública.
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/negocios/${business._id.toString()}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 transition group-hover:text-indigo-900"
                  >
                    Gerenciar negócio
                    <FiArrowUpRight size={17} />
                  </Link>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
