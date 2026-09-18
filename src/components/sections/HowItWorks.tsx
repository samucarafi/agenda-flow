import { FiCalendar, FiCheckCircle, FiUser } from "react-icons/fi";

const steps = [
  {
    number: "01",
    icon: FiCalendar,
    title: "Você configura",
    description:
      "Cadastre seus serviços, horários de atendimento e profissionais.",
  },
  {
    number: "02",
    icon: FiUser,
    title: "Seu cliente agenda",
    description:
      "Ele escolhe o serviço, o profissional e o melhor horário para ele.",
  },
  {
    number: "03",
    icon: FiCheckCircle,
    title: "Tudo organizado",
    description:
      "Os agendamentos ficam centralizados para você acompanhar facilmente.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="border-t border-zinc-200 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#635bff]">Como funciona</p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Menos complicação.
            <br />
            Mais tempo para o seu negócio.
          </h2>

          <p className="mt-4 text-sm leading-6 text-zinc-500 sm:text-base sm:leading-7">
            O AgendaFlow simplifica o processo de agendamento do início ao fim.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="relative rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
                    <Icon size={19} />
                  </div>

                  <span className="text-xs font-medium text-zinc-300">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-6 text-base font-semibold text-zinc-900">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
