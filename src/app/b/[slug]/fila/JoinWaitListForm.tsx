"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { joinRestaurantWaitlistAsClient } from "@/actions/restaurant-waitlist";

export default function JoinWaitlistForm({
  businessId,
  businessName,
  accentColor,
  accentText,
  isQueueOpen,
  openingTime,
  closingTime,
  workingDaysLabel,
}: {
  businessId: string;
  businessName: string;
  accentColor: string;
  accentText: string;
  isQueueOpen: boolean;
  openingTime: string;
  closingTime: string;
  workingDaysLabel: string;
}) {
  const router = useRouter();
  const [partySize, setPartySize] = useState("2");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("partySize", partySize);
    formData.set("notes", notes);

    try {
      const result = await joinRestaurantWaitlistAsClient(formData);

      if (!result.success) {
        setError(result.error ?? "Não foi possível entrar na fila.");
        return;
      }
      router.refresh();
    } catch {
      setError("Não foi possível entrar na fila. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section data-business-surface className="rounded-3xl border border-current/15 p-6 shadow-sm sm:p-8" style={{ backgroundColor: "color-mix(in srgb, var(--business-primary) 86%, white)" }}>
      <div className="flex size-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${accentColor}22` }}>
        🍽️
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight">
        Entrar na fila de espera
      </h2>

      <p className="mt-2 text-sm leading-6 opacity-75">
        Informe o tamanho do grupo para entrar na fila de espera de {businessName}. Você poderá acompanhar a chamada nesta página e na sua conta.
      </p>

      {!isQueueOpen ? (
        <div role="status" className="mt-6 rounded-2xl border border-current/15 bg-current/5 p-4 text-sm leading-6">
          A fila está fechada no momento. Você poderá entrar durante o horário de atendimento: {workingDaysLabel || "dias informados pelo restaurante"}, das {openingTime} às {closingTime}.
        </div>
      ) : <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={pending}>
        <label htmlFor="waitlist-party-size" className="block space-y-2 text-sm font-medium">
          Quantas pessoas estão no grupo?
          <input
            id="waitlist-party-size"
            type="number"
            min={1}
            max={40}
            required
            disabled={pending}
            value={partySize}
            onChange={(event) => setPartySize(event.target.value)}
            className="w-full rounded-xl border border-current/20 bg-white/5 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
            style={{ color: "inherit", "--tw-ring-color": accentColor } as React.CSSProperties}
          />
        </label>

        <label htmlFor="waitlist-notes" className="block space-y-2 text-sm font-medium">
          Observações (opcional)
          <textarea
            id="waitlist-notes"
            maxLength={300}
            rows={3}
            disabled={pending}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Alguma informação para a equipe?"
            className="w-full resize-y rounded-xl border border-current/20 bg-white/5 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
            style={{ color: "inherit", "--tw-ring-color": accentColor } as React.CSSProperties}
          />
        </label>

        {error && (
          <p id="waitlist-error" role="alert" aria-live="assertive" className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl px-5 py-3 font-semibold transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: accentColor, color: accentText, "--tw-ring-color": accentColor } as React.CSSProperties}
        >
          {pending ? "Entrando na fila…" : "Entrar na fila de espera"}
        </button>
        <p className="sr-only" role="status" aria-live="polite">{pending ? "Enviando sua solicitação para entrar na fila." : ""}</p>
      </form>}
    </section>
  );
}
