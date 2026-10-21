"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveRestaurantWaitlistAsClient } from "@/actions/restaurant-waitlist";

export default function LeaveQueueButton({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLeave() {
    if (!window.confirm(`Deseja sair da fila de ${businessName}?`)) {
      return;
    }

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
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void handleLeave()}
        disabled={pending}
        className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
      >
        {pending ? "Saindo..." : "Cancelar participação na fila"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
