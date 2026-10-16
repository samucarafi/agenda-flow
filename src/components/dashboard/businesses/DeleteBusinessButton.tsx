"use client";

import { useState, type FormEvent } from "react";
import { deleteBusiness } from "@/actions/businesses";
import { FiTrash2 } from "react-icons/fi";

interface Props {
  businessId: string;
  businessName: string;
}

export function DeleteBusinessButton({ businessId, businessName }: Props) {
  const [confirming, setConfirming] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${businessName}"? ` +
        "Os serviços, clientes vinculados e agendamentos deste negócio serão excluídos. Esta ação não pode ser desfeita.",
    );

    if (!confirmed) {
      event.preventDefault();
      setConfirming(false);
      return;
    }

    setConfirming(true);
  }

  return (
    <form action={deleteBusiness} onSubmit={handleSubmit}>
      <input type="hidden" name="businessId" value={businessId} />

      <button
        type="submit"
        disabled={confirming}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-60"
      >
        <FiTrash2 size={16} />
        {confirming ? "Excluindo negócio..." : "Excluir negócio"}
      </button>
    </form>
  );
}
