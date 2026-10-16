import Link from "next/link";
import { FiArrowUpRight, FiCalendar, FiPlus } from "react-icons/fi";

import { Stats } from "./Stats";
import { TodaySchedule } from "./TodaySchedule";
import { UpcomingAppointments } from "./UpcomingAppointments";
import { DashboardLayout } from "./DashboardLayout";

export function Dashboard() {
  return (
    <DashboardLayout
      title="Visão geral"
      description="Acompanhe o que está acontecendo no seu negócio."
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
            Bom dia!
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Acesse seus negócios para gerenciar os atendimentos.
          </p>
        </div>

        <Link
          href="/dashboard/negocios"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <FiPlus size={18} />
          Escolher negócio e agendar
        </Link>
      </div>

      <Stats />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <TodaySchedule />
        <UpcomingAppointments />
      </div>

      <div className="mt-5 flex justify-end">
        <Link
          href="/dashboard/negocios"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <FiCalendar size={16} />
          Acessar agendas dos negócios
          <FiArrowUpRight size={15} />
        </Link>
      </div>
    </DashboardLayout>
  );
}
