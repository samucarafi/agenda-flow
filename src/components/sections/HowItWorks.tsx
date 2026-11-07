import { FiCheckCircle, FiClipboard, FiGlobe, FiSettings } from "react-icons/fi";

const steps = [
  { number: "01", icon: FiClipboard, title: "Cadastre seu estabelecimento", description: "Crie sua conta e escolha a categoria do seu negócio para começar com uma experiência adequada à sua operação." },
  { number: "02", icon: FiSettings, title: "Configure sua rotina", description: "Defina os serviços e horários da barbearia ou organize mesas e fila de espera no restaurante." },
  { number: "03", icon: FiGlobe, title: "Compartilhe sua página", description: "Apresente seu estabelecimento em uma página pública com informações e identidade visual próprias." },
  { number: "04", icon: FiCheckCircle, title: "Acompanhe pelo painel", description: "Gerencie os recursos do seu negócio e acompanhe a operação em um só lugar." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-white/10 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-indigo-300">Como funciona</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">Do primeiro acesso à gestão do dia a dia.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">Você configura o que faz sentido para seu estabelecimento. O AgendaFlow organiza a experiência de acordo com o tipo de negócio.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
          {steps.map((step) => { const Icon = step.icon; return (
            <article key={step.number} className="relative rounded-2xl border border-white/10 bg-[#111c30] p-5 transition-colors hover:border-indigo-300/25 sm:p-6">
              <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300"><Icon size={20} /></span><span className="text-xs font-semibold tracking-widest text-slate-500">{step.number}</span></div>
              <h3 className="mt-6 text-base font-semibold text-white">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
            </article>
          ); })}
        </div>
      </div>
    </section>
  );
}
