"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

type AppointmentHistoryEntry = {
  id: string;
  serviceName: string;
  businessName: string;
  businessSlug: string | null;
  date: string;
  startTime: string;
  status: string;
};

export function AppointmentHistory({
  entries,
  statusLabels,
}: {
  entries: AppointmentHistoryEntry[];
  statusLabels: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, 5);
  const hiddenCount = entries.length - visible.length;

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(date));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Histórico</h2>
          <p className="mt-1 text-sm text-slate-400">Seus atendimentos anteriores e agendamentos cancelados.</p>
        </div>
        {entries.length > 5 && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {expanded ? "Mostrar menos" : `Mostrar mais (${hiddenCount})`}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-slate-400">
          Seu histórico aparecerá aqui quando houver agendamentos.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
          {visible.map((appointment) => (
            <div key={appointment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">{appointment.serviceName}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {appointment.businessName} · {formatDate(appointment.date)} · {appointment.startTime}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="text-xs text-slate-400">{statusLabels[appointment.status] ?? appointment.status}</span>
                {appointment.businessSlug && (
                  <Link
                    href={`/b/${appointment.businessSlug}`}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Visitar novamente <FiArrowUpRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
