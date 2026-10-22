"use client";

import { useState } from "react";

type HistoryEntry = {
  id: string;
  businessName: string;
  partySize: number;
  status: string;
};

export default function QueueHistory({
  entries,
  statusLabels,
}: {
  entries: HistoryEntry[];
  statusLabels: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? entries : entries.slice(0, 5);
  const hiddenCount = entries.length - visibleEntries.length;

  if (!entries.length) return null;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Histórico</h2>
          <p className="mt-1 text-sm text-slate-400">
            Exibindo {visibleEntries.length} de {entries.length} registros.
          </p>
        </div>
        {entries.length > 5 && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {expanded ? "Mostrar menos" : `Mostrar mais (${hiddenCount})`}
          </button>
        )}
      </div>
      <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {visibleEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="font-medium text-white">{entry.businessName}</p>
              <p className="mt-1 text-sm text-slate-400">
                Grupo de {entry.partySize} {entry.partySize === 1 ? "pessoa" : "pessoas"}
              </p>
            </div>
            <span className="text-sm text-slate-300">
              {statusLabels[entry.status] ?? entry.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
