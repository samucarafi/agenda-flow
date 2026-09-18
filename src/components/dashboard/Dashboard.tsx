import Link from "next/link";
import { FiArrowUpRight, FiPlus } from "react-icons/fi";

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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
            Bom dia, Samuel.
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Aqui está um resumo do seu negócio hoje.
          </p>
        </div>

        <Link
          href="/agenda"
          className="inline-flex h-9 w-fit items-center gap-2 rounded-xl bg-[#635bff] px-3.5 text-xs font-semibold text-white hover:bg-[#5148e8]"
        >
          <FiPlus size={14} />
          Novo agendamento
        </Link>
      </div>

      <Stats />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <TodaySchedule />
        <UpcomingAppointments />
      </div>

      <div className="mt-5 flex justify-end">
        <Link
          href="/dashboard/agenda"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          Ver agenda completa
          <FiArrowUpRight size={13} />
        </Link>
      </div>
    </DashboardLayout>
  );
}
