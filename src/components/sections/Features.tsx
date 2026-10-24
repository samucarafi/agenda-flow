import Link from "next/link";
import {
  FiBell,
  FiCalendar,
  FiBarChart2,
  FiUsers,
  FiArrowUpRight,
} from "react-icons/fi";

const features = [
  {
    icon: FiCalendar,
    title: "Agenda organizada",
    description:
      "Visualize seus horários e saiba exatamente o que está acontecendo no seu dia.",
  },
  {
    icon: FiUsers,
    title: "Clientes em um só lugar",
    description:
      "Tenha as informações dos seus clientes organizadas e fáceis de encontrar.",
  },
  {
    icon: FiBell,
    title: "Lembretes",
    description:
      "Ajude seus clientes a lembrarem dos horários e reduza esquecimentos.",
  },
  {
    icon: FiBarChart2,
    title: "Visão do negócio",
    description:
      "Acompanhe seus atendimentos e tenha uma visão mais clara da sua rotina.",
  },
];

export function Features() {
  return (
    <section
      id="recursos"
      className="border-t border-white/10 bg-slate-900/50 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-300">Recursos</p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Tudo para deixar sua rotina mais simples.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Ferramentas pensadas para você gastar menos tempo organizando a
              agenda e mais tempo cuidando do seu negócio.
            </p>
          </div>

          <span className="hidden text-xs text-slate-400 sm:block">
            Simples por natureza.
          </span>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-[#111c30] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/30 hover:bg-slate-800 hover:shadow-lg hover:shadow-black/20 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300 shadow-sm">
                    <Icon size={19} />
                  </div>

                  <FiArrowUpRight
                    size={16}
                    className="text-slate-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-300"
                  />
                </div>

                <h3 className="mt-6 text-base font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
        <div
          id="beneficios"
          className="mt-12 scroll-mt-28 rounded-3xl border border-indigo-300/15 bg-indigo-400/[0.07] p-6 sm:p-10"
        >
          <p className="text-sm font-semibold text-indigo-300">Benefícios</p>

          <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Menos tempo organizando. Mais tempo atendendo.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Centralize clientes, serviços e horários em um só lugar e ofereça aos
            seus clientes uma experiência de reserva mais simples.
          </p>

          <Link
            href="/criar-conta"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5148e8]"
          >
            Começar agora
            <FiArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
