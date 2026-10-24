import Link from "next/link";
import { FiArrowRight, FiCheck, FiClock } from "react-icons/fi";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#635bff]/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-16 sm:px-6 sm:pb-20 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-[#635bff]" />
              Gestão simples para o seu negócio
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
              Sua agenda organizada.
              <span className="text-[#635bff]">
                {" "}
                Seus clientes satisfeitos.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Organize horários, serviços e clientes em um só lugar. Uma
              experiência simples para você e para quem agenda.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/criar-conta"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#635bff] px-5 text-sm font-semibold text-white shadow-lg shadow-[#635bff]/20 transition-all hover:-translate-y-0.5 hover:bg-[#5148e8]"
              >
                Começar agora
                <FiArrowRight size={16} />
              </Link>

              <Link
                href="#como-funciona"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
              >
                Conhecer o sistema
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-300">
                <FiCheck className="text-emerald-500" size={14} />
                Fácil de usar
              </span>

              <span className="flex items-center gap-1.5 text-xs text-slate-300">
                <FiCheck className="text-emerald-500" size={14} />
                Acesso de qualquer lugar
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-[#111c30] p-4 shadow-2xl shadow-black/30 sm:p-5">
              <div className="rounded-2xl bg-slate-900/80 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Hoje</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      Seus agendamentos
                    </h2>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
                    <FiClock size={17} />
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    ["09:00", "João Martins", "Corte"],
                    ["10:30", "Mariana Costa", "Coloração"],
                    ["14:00", "Pedro Alves", "Barba"],
                    ["16:30", "Samuel Souza", "Corte + Barba"],
                  ].map(([time, name, service]) => (
                    <div
                      key={`${time}-${name}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-800/70 p-3"
                    >
                      <span className="w-10 text-xs font-semibold text-slate-300">
                        {time}
                      </span>

                      <div className="h-8 w-8 shrink-0 rounded-full bg-slate-700" />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {name}
                        </p>

                        <p className="text-xs text-slate-400">{service}</p>
                      </div>

                      <span className="ml-auto hidden rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600 sm:block">
                        Confirmado
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-3 hidden rounded-2xl border border-white/10 bg-[#111c30] p-3 shadow-xl sm:block">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <FiCheck size={15} />
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Novo agendamento</p>

                  <p className="text-xs font-semibold text-slate-100">
                    Confirmado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
