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
    .select("name slug category status description createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <DashboardLayout
      title="Meus negócios"
      description="Gerencie seus estabelecimentos."
      showHeader={false}
    >
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-400">
                ESPAÇO DE TRABALHO
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Meus negócios
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Gerencie seus estabelecimentos e personalize cada experiência de
                atendimento.
              </p>
            </div>

            <Link
              href="/dashboard/negocios/novo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <FiPlus size={18} />
              Novo negócio
            </Link>
          </header>

          {businesses.length === 0 ? (
            <section className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                <FiBriefcase size={26} />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                Seu primeiro negócio começa aqui
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Cadastre sua barbearia, salão ou restaurante para começar a
                configurar seus serviços e suas reservas.
              </p>

              <Link
                href="/dashboard/negocios/novo"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
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
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                      <CategoryIcon category={business.category} />
                    </div>

                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {statusLabels[business.status] ?? "Indefinido"}
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    {business.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {categoryLabels[business.category] ?? "Outro negócio"}
                  </p>

                  {business.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                      {business.description}
                    </p>
                  )}

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-xs text-slate-400">Página pública</p>

                    <Link
                      href={`/b/${business.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 break-all text-sm font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      /b/{business.slug}
                      <FiArrowUpRight size={16} />
                    </Link>

                    {business.status === "active" ? (
                      <Link
                        href={`/b/${business.slug}/agendar?preview=1`}
                        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
                      >
                        Pré-visualizar agendamento.
                        <FiArrowUpRight size={16} />
                      </Link>
                    ) : (
                      <p className="mt-2 text-xs text-amber-300">
                        Ative o negócio para disponibilizar a página pública.
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/negocios/${business._id.toString()}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 transition group-hover:text-cyan-300"
                  >
                    Gerenciar negócio
                    <FiArrowUpRight size={17} />
                  </Link>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
