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
      className="border-t border-zinc-200 bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#635bff]">Recursos</p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              Tudo para deixar sua rotina mais simples.
            </h2>

            <p className="mt-4 text-sm leading-6 text-zinc-500 sm:text-base sm:leading-7">
              Ferramentas pensadas para você gastar menos tempo organizando a
              agenda e mais tempo cuidando do seu negócio.
            </p>
          </div>

          <span className="hidden text-xs text-zinc-400 sm:block">
            Simples por natureza.
          </span>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#635bff]/20 hover:bg-white hover:shadow-lg hover:shadow-zinc-900/5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#635bff] shadow-sm">
                    <Icon size={19} />
                  </div>

                  <FiArrowUpRight
                    size={16}
                    className="text-zinc-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#635bff]"
                  />
                </div>

                <h3 className="mt-6 text-base font-semibold text-zinc-900">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
