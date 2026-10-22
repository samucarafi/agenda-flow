"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { leaveRestaurantWaitlistAsClient } from "@/actions/restaurant-waitlist";

type EntryStatus = "waiting" | "called" | "seated";
type Theme = {
  accentColor: string;
  accentText: string;
  accentLabelColor: string;
};

type Entry = {
  id: string;
  position: number;
  partySize: number;
  status: EntryStatus;
  joinedAt: string;
  tableName: string | null;
};

export default function RestaurantWaitlistStatus({
  businessId,
  businessName,
  initialEntry,
  theme,
}: {
  businessId: string;
  businessName: string;
  initialEntry: Entry;
  theme: Theme;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refreshIfVisible, 10000);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [router]);

  async function leaveQueue() {
    const confirmed = window.confirm(`Deseja sair da fila de ${businessName}?`);

    if (!confirmed) return;

    setPending(true);
    setError("");

    const formData = new FormData();
    formData.set("businessId", businessId);

    try {
      const result = await leaveRestaurantWaitlistAsClient(formData);

      if (!result.success) {
        setError(result.error ?? "Não foi possível sair da fila.");
        return;
      }

      router.refresh();
    } catch {
      setError("Ocorreu um erro ao sair da fila.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section data-business-surface className="rounded-3xl border border-current/15 p-6 shadow-sm sm:p-8" style={{ backgroundColor: "color-mix(in srgb, var(--business-primary) 86%, white)" }}>
      <p className="text-sm font-semibold" style={{ color: theme.accentLabelColor }}>SUA PARTICIPAÇÃO</p>

      <h2 className="mt-2 text-2xl font-bold">
        Você já está na fila
      </h2>

      <p className="mt-2 opacity-75">{businessName}</p>

      <div className="mt-6 rounded-2xl border border-current/10 p-5" style={{ backgroundColor: `${theme.accentColor}18` }}>
        <p className="text-sm opacity-80">Situação atual</p>

        <p className="mt-1 text-xl font-bold">
          {initialEntry.status === "called"
            ? "Você foi chamado!"
            : initialEntry.status === "seated"
              ? "Você já foi acomodado"
              : "Aguardando"}
        </p>

        {initialEntry.status === "waiting" && (
          <p className="mt-3 text-sm">
            Sua posição atual é {initialEntry.position}.
          </p>
        )}

        <p className="mt-2 text-sm opacity-75">
          Grupo de {initialEntry.partySize}{" "}
          {initialEntry.partySize === 1 ? "pessoa" : "pessoas"}.
        </p>

        <p className="mt-2 text-sm opacity-75">
          Entrada registrada em{" "}
          {new Date(initialEntry.joinedAt).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>

        {initialEntry.status === "seated" && initialEntry.tableName && (
          <p className="mt-2 font-semibold" style={{ color: theme.accentLabelColor }}>
            Mesa: {initialEntry.tableName}
          </p>
        )}
      </div>

      {initialEntry.status === "called" && (
        <p role="status" className="mt-4 text-sm font-medium">
          Procure a equipe do restaurante para receber atendimento.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-rose-700">
          {error}
        </p>
      )}

      {(initialEntry.status === "waiting" ||
        initialEntry.status === "called") && (
        <button
          type="button"
          onClick={() => void leaveQueue()}
          disabled={pending}
          className="mt-6 w-full rounded-xl border border-current/25 px-4 py-3 font-semibold transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
        >
          {pending ? "Saindo da fila..." : "Sair da fila"}
        </button>
      )}

      <p className="mt-3 text-xs opacity-60">
        A posição é atualizada automaticamente a cada 10 segundos.
      </p>
    </section>
  );
}
