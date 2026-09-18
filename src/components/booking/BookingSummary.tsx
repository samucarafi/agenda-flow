import { FiCalendar, FiClock, FiUser } from "react-icons/fi";
import type { Professional, Service } from "@/data/booking";

interface BookingSummaryProps {
  service?: Service;
  professional?: Professional;
  time: string;
}

export function BookingSummary({
  service,
  professional,
  time,
}: BookingSummaryProps) {
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#635bff]">
        Resumo
      </p>

      <h3 className="mt-2 text-lg font-semibold text-zinc-900">
        Seu agendamento
      </h3>

      <div className="mt-5 space-y-4">
        <div className="flex gap-3">
          <FiCalendar size={16} className="mt-0.5 text-zinc-400" />

          <div>
            <p className="text-xs text-zinc-400">Data</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-800">
              20 de setembro de 2026
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <FiClock size={16} className="mt-0.5 text-zinc-400" />

          <div>
            <p className="text-xs text-zinc-400">Horário</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-800">
              {time || "Selecione um horário"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <FiUser size={16} className="mt-0.5 text-zinc-400" />

          <div>
            <p className="text-xs text-zinc-400">Profissional</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-800">
              {professional?.name || "Selecione"}
            </p>
          </div>
        </div>
      </div>

      <div className="my-5 h-px bg-zinc-200" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {service?.name || "Serviço"}
        </span>

        <span className="text-base font-semibold text-zinc-900">
          {service ? `R$ ${service.price.toFixed(2).replace(".", ",")}` : "—"}
        </span>
      </div>
    </aside>
  );
}
