import Link from "next/link";
import { FiArrowUpRight, FiCalendar, FiCheck, FiClock, FiCoffee, FiLayers, FiScissors, FiSettings, FiUsers } from "react-icons/fi";

const barberFeatures = ["Cadastro de serviços, duração e valores", "Organização dos horários e agendamentos", "Acompanhamento dos atendimentos", "Página pública para apresentar o negócio"];
const restaurantFeatures = ["Cadastro e gerenciamento de mesas", "Controle de ocupação e liberação", "Fila de espera e acompanhamento de clientes", "Visão da operação do restaurante"];
const sharedFeatures = [
  { icon: FiLayers, title: "Experiência por categoria", description: "A navegação e os recursos acompanham o tipo de estabelecimento, sem misturar ferramentas que não fazem parte da rotina." },
  { icon: FiSettings, title: "Personalização do negócio", description: "Configure as informações e a identidade visual da página pública para apresentar seu estabelecimento aos clientes." },
  { icon: FiClock, title: "Acompanhamento centralizado", description: "Tenha uma visão organizada da operação e acompanhe as atividades importantes pelo painel do estabelecimento." },
];

export function Features() {
  return (
    <>
      <section id="solucoes" className="scroll-mt-24 border-t border-white/10 bg-slate-900/45 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-indigo-300">Soluções por negócio</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Ferramentas que acompanham o seu jeito de trabalhar.</h2><p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">Cada categoria tem recursos próprios para simplificar tarefas que fazem parte da rotina do estabelecimento.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2 lg:gap-6">
            <article className="overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-400/[0.12] via-[#111c30] to-[#111c30] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/10 text-violet-200"><FiScissors size={22} /></div><span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-[10px] font-bold tracking-wider text-violet-200">BARBEARIAS</span></div>
              <h3 className="mt-6 text-xl font-bold text-white sm:text-2xl">Sua agenda sob controle.</h3><p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">Organize os serviços oferecidos e acompanhe os agendamentos para manter a rotina de atendimento mais previsível.</p>
              <ul className="mt-6 space-y-3">{barberFeatures.map((feature) => <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-200"><FiCheck className="mt-0.5 shrink-0 text-violet-300" size={16} /> {feature}</li>)}</ul>
              <div className="mt-7 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-black/15 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200"><FiCalendar /></span><div><p className="text-xs font-semibold text-white">Agendamentos organizados</p><p className="mt-0.5 text-[11px] text-slate-400">Serviços e horários em um só painel</p></div></div>
            </article>
            <article className="overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.11] via-[#111c30] to-[#111c30] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200"><FiCoffee size={22} /></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-wider text-cyan-200">RESTAURANTES</span></div>
              <h3 className="mt-6 text-xl font-bold text-white sm:text-2xl">Mesas e filas organizadas.</h3><p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">Visualize a situação das mesas, acompanhe a ocupação e gerencie a fila de espera com mais clareza.</p>
              <ul className="mt-6 space-y-3">{restaurantFeatures.map((feature) => <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-200"><FiCheck className="mt-0.5 shrink-0 text-cyan-300" size={16} /> {feature}</li>)}</ul>
              <div className="mt-7 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-black/15 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><FiUsers /></span><div><p className="text-xs font-semibold text-white">Controle da operação</p><p className="mt-0.5 text-[11px] text-slate-400">Mesas, ocupação e fila de espera</p></div></div>
            </article>
          </div>
        </div>
      </section>
      <section id="recursos" className="border-t border-white/10 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-indigo-300">Uma plataforma flexível</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Seu estabelecimento com identidade própria.</h2><p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">Além das ferramentas específicas de cada categoria, o AgendaFlow ajuda você a apresentar e acompanhar seu negócio.</p></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">{sharedFeatures.map((feature) => { const Icon = feature.icon; return <article key={feature.title} className="rounded-2xl border border-white/10 bg-[#111c30] p-5 sm:p-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300"><Icon size={19} /></span><h3 className="mt-5 text-base font-semibold text-white">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p></article>; })}</div>
          <div id="beneficios" className="mt-12 scroll-mt-28 overflow-hidden rounded-3xl border border-indigo-300/15 bg-gradient-to-r from-indigo-500/15 via-indigo-400/[0.07] to-cyan-400/[0.06] p-6 sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div className="max-w-2xl"><p className="text-sm font-semibold text-indigo-300">Comece pelo seu negócio</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Menos tarefas espalhadas. Mais clareza na sua operação.</h2><p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">Configure seu estabelecimento e conheça uma experiência de gestão pensada para a sua rotina.</p></div><Link href="/criar-conta/empreendedor" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#635bff] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#635bff]/20 transition hover:-translate-y-0.5 hover:bg-[#5148e8]">Criar minha conta <FiArrowUpRight size={16} /></Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
