import Link from "next/link";
import { FiArrowRight, FiCalendar, FiCheck, FiClock, FiCoffee, FiScissors, FiUsers } from "react-icons/fi";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-32 sm:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[12%] top-10 h-72 w-72 rounded-full bg-[#635bff]/15 blur-[110px]" />
        <div className="absolute right-[8%] top-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 sm:px-6 sm:pb-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3.5 py-2 text-xs font-semibold text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-[#8b83ff]" /> Gestão inteligente para negócios reais
          </div>
          <h1 className="mt-7 max-w-2xl text-[2.65rem] font-bold leading-[1.06] tracking-[-0.045em] text-white sm:text-5xl md:text-[3.7rem]">
            Seu negócio tem uma rotina própria.
            <span className="mt-1 block bg-gradient-to-r from-[#a59fff] via-[#8278ff] to-cyan-300 bg-clip-text text-transparent">Sua gestão também deve ter.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Do controle de agendamentos em barbearias à gestão de mesas e filas em restaurantes. O AgendaFlow reúne ferramentas pensadas para a realidade de cada estabelecimento.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/criar-conta" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#635bff] px-5 text-sm font-semibold text-white shadow-lg shadow-[#635bff]/25 transition-all hover:-translate-y-0.5 hover:bg-[#5148e8]">
              Começar agora <FiArrowRight size={16} />
            </Link>
            <Link href="#solucoes" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.09]">Conhecer as soluções</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-slate-300">
            <span className="inline-flex items-center gap-2"><FiCheck className="text-emerald-400" /> Recursos por tipo de negócio</span>
            <span className="inline-flex items-center gap-2"><FiCheck className="text-emerald-400" /> Página pública personalizável</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-indigo-500/15 via-transparent to-cyan-400/10 blur-2xl" />
          <div className="relative rounded-[1.7rem] border border-white/10 bg-[#111c30]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur sm:p-4">
            <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
              <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635bff] text-xs font-bold text-white">A</span><span className="text-sm font-semibold text-white">AgendaFlow</span></div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">Painel do negócio</span>
            </div>
            <div className="grid gap-3 p-1 pt-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300"><FiScissors size={18} /></span><span className="text-[10px] font-medium text-slate-500">BARBEARIA</span></div>
                <h2 className="mt-4 text-sm font-semibold text-white">Agenda de hoje</h2><p className="mt-1 text-xs text-slate-400">Serviços e horários organizados</p>
                <div className="mt-4 space-y-2">
                  {[["09:00","Corte tradicional"],["10:30","Corte + barba"],["11:30","Degradê"]].map(([time, service]) => <div key={time} className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-2.5"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-violet-200">{time}</span><span className="text-[9px] text-emerald-300">Confirmado</span></div><p className="mt-1 text-xs font-medium text-slate-200">{service}</p></div>)}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400"><FiCalendar /> Agendamentos acompanhados em um só lugar</div>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><FiCoffee size={18} /></span><span className="text-[10px] font-medium text-slate-500">RESTAURANTE</span></div>
                <h2 className="mt-4 text-sm font-semibold text-white">Operação em tempo real</h2><p className="mt-1 text-xs text-slate-400">Mesas e fila de espera</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[["Mesa 01","Ocupada","bg-amber-400"],["Mesa 02","Disponível","bg-emerald-400"],["Mesa 03","Ocupada","bg-amber-400"],["Mesa 04","Disponível","bg-emerald-400"]].map(([table,state,color]) => <div key={table} className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-2.5"><div className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${color}`} /><span className="text-[11px] font-semibold text-slate-200">{table}</span></div><p className="mt-1 text-[10px] text-slate-400">{state}</p></div>)}
                </div>
                <div className="mt-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] p-3"><div className="flex items-center gap-2 text-cyan-200"><FiUsers size={13} /><span className="text-[11px] font-semibold">Fila de espera</span></div><p className="mt-1 text-xs text-slate-300">Clientes e posições organizados</p></div>
              </article>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5"><div className="flex items-center gap-2 text-xs text-slate-300"><FiClock className="text-indigo-300" /> Cada negócio com seu próprio fluxo</div><span className="text-[10px] font-semibold text-indigo-200">AgendaFlow</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
