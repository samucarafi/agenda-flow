"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { joinRestaurantWaitlistAsClient } from "@/actions/restaurant-waitlist";

export default function JoinWaitlistForm({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const router = useRouter();
  const [partySize, setPartySize] = useState("2");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

      router.push("/cliente/fila");
      router.refresh();
    } catch {
      setError("Não foi possível entrar na fila. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
        🍽️
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
        Entre na fila
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Você entrará na fila de espera de {businessName}. Acompanhe sua posição
        pela sua conta no AgendaFlow.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Quantas pessoas estão no grupo?
          <input
            type="number"
            min={1}
            max={40}
            required
            value={partySize}
            onChange={(event) => setPartySize(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Observações (opcional)
          <textarea
            maxLength={300}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Alguma informação para a equipe?"
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Entrando na fila..." : "Entrar na fila"}
        </button>
      </form>
    </section>
  );
}
