"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { leaveRestaurantWaitlistAsClient } from "@/actions/restaurant-waitlist";

type EntryStatus = "waiting" | "called" | "seated";

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
}: {
  businessId: string;
  businessName: string;
  initialEntry: Entry;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 10000);

    return () => window.clearInterval(interval);
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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-indigo-600">SUA PARTICIPAÇÃO</p>

      <h2 className="mt-2 text-2xl font-bold text-slate-950">
        Você já está na fila
      </h2>

      <p className="mt-2 text-slate-600">{businessName}</p>

      <div className="mt-6 rounded-2xl bg-indigo-50 p-5">
        <p className="text-sm text-indigo-700">Situação atual</p>

        <p className="mt-1 text-xl font-bold text-indigo-950">
          {initialEntry.status === "called"
            ? "Você foi chamado!"
            : initialEntry.status === "seated"
              ? "Você já foi acomodado"
              : "Aguardando"}
        </p>

        {initialEntry.status === "waiting" && (
          <p className="mt-3 text-sm text-indigo-800">
            Sua posição atual é {initialEntry.position}.
          </p>
        )}

        <p className="mt-2 text-sm text-slate-600">
          Grupo de {initialEntry.partySize}{" "}
          {initialEntry.partySize === 1 ? "pessoa" : "pessoas"}.
        </p>

        <p className="mt-2 text-sm text-slate-600">
          Entrada registrada em{" "}
          {new Date(initialEntry.joinedAt).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>

        {initialEntry.status === "seated" && initialEntry.tableName && (
          <p className="mt-2 font-semibold text-emerald-700">
            Mesa: {initialEntry.tableName}
          </p>
        )}
      </div>

      {initialEntry.status === "called" && (
        <p role="status" className="mt-4 text-sm font-medium text-amber-800">
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
          className="mt-6 w-full rounded-xl border border-rose-200 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
        >
          {pending ? "Saindo da fila..." : "Sair da fila"}
        </button>
      )}

      <p className="mt-3 text-xs text-slate-500">
        A posição é atualizada automaticamente a cada 10 segundos.
      </p>
    </section>
  );
}
