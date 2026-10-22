"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createRestaurantTable,
  deactivateRestaurantTable,
  reactivateRestaurantTable,
  updateRestaurantTableStatus,
} from "@/actions/restaurant-tables";
import { releaseRestaurantTable } from "@/actions/restaurant-waitlist";

type TableStatus = "available" | "occupied" | "cleaning" | "blocked";

type TableItem = {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  occupiedEntry: { name: string; partySize: number } | null;
};

const statusLabels: Record<TableStatus, string> = {
  available: "Disponível",
  occupied: "Ocupada",
  cleaning: "Em limpeza",
  blocked: "Bloqueada",
};

const statusStyles: Record<TableStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  occupied: "border-rose-200 bg-rose-50 text-rose-700",
  cleaning: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-slate-200 bg-slate-100 text-slate-700",
};

type ActionResult = {
  success: boolean;
  error?: string;
};

export default function TableManager({
  businessId,
  initialTables,
  initialInactiveTables,
  continueToPublish = false,
}: {
  businessId: string;
  initialTables: TableItem[];
  initialInactiveTables: TableItem[];
  continueToPublish?: boolean;
}) {
  const router = useRouter();
  const [tables, setTables] = useState(initialTables);
  const [inactiveTables, setInactiveTables] = useState(initialInactiveTables);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function runAction(
    action: (formData: FormData) => Promise<ActionResult>,
    formData: FormData,
  ) {
    setPending(true);
    setMessage("");
    setError("");

    try {
      const result = await action(formData);

      if (!result.success) {
        setError(result.error ?? "Não foi possível concluir a operação.");
        return false;
      }

      setMessage("Alteração salva com sucesso.");
      return true;
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstTableInSetup = continueToPublish && tables.length === 0;

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("name", name);
    formData.set("capacity", capacity);

    const success = await runAction(createRestaurantTable, formData);

    if (success) {
      setName("");
      setCapacity("2");
      if (firstTableInSetup) {
        router.push(`/dashboard/negocios/${businessId}/configuracoes?success=tables`);
        return;
      }
      router.refresh();
    }
  }

  async function handleStatus(tableId: string, status: TableStatus) {
    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("tableId", tableId);
    formData.set("status", status);

    const success = await runAction(updateRestaurantTableStatus, formData);

    if (success) {
      setTables((current) =>
        current.map((table) =>
          table.id === tableId ? { ...table, status } : table,
        ),
      );
    }
  }

  async function handleDeactivate(tableId: string) {
    const confirmed = window.confirm(
      "Deseja desativar esta mesa? Ela deixará de aparecer na lista ativa.",
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("tableId", tableId);

    const success = await runAction(deactivateRestaurantTable, formData);

    if (success) {
      const table = tables.find((item) => item.id === tableId);

      if (table) {
        // Remove da lista ativa imediatamente.
        setTables((current) => current.filter((item) => item.id !== tableId));

        // Adiciona à lista de desativadas sem recarregar a página.
        setInactiveTables((current) => [
          { ...table, status: "available" },
          ...current,
        ]);
      }
    }
  }

  const available = tables.filter(
    (table) => table.status === "available",
  ).length;
  const occupied = tables.filter((table) => table.status === "occupied").length;

  async function handleReactivate(tableId: string) {
    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("tableId", tableId);

    const success = await runAction(reactivateRestaurantTable, formData);

    if (success) {
      const table = inactiveTables.find((item) => item.id === tableId);

      if (table) {
        setInactiveTables((current) =>
          current.filter((item) => item.id !== tableId),
        );

        setTables((current) => [{ ...table, status: "available" }, ...current]);
      }
    }
  }

  async function handleRelease(table: TableItem) {
    const confirmed = window.confirm(
      `Confirma que o grupo de ${table.occupiedEntry?.name ?? "clientes"} deixou a mesa ${table.name}?`,
    );
    if (!confirmed) return;

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("tableId", table.id);
    const success = await runAction(releaseRestaurantTable, formData);
    if (success) {
      setTables((current) => current.map((item) => item.id === table.id
        ? { ...item, status: "available", occupiedEntry: null }
        : item));
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Summary label="Mesas cadastradas" value={tables.length} />
        <Summary label="Disponíveis" value={available} />
        <Summary label="Ocupadas" value={occupied} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Nova mesa</h2>
          <p className="mt-1 text-sm text-slate-500">
            Informe um nome único e quantas pessoas ela comporta.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="grid gap-4 sm:grid-cols-[1fr_160px_auto]"
        >
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Nome da mesa
            <input
              required
              minLength={1}
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Mesa 01"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Capacidade
            <input
              required
              type="number"
              min={1}
              max={40}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {pending ? "Salvando..." : "Adicionar mesa"}
            </button>
          </div>
        </form>

        {message && (
          <p role="status" className="mt-4 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-rose-700">
            {error}
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Suas mesas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie a disponibilidade durante o expediente.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            {tables.length} {tables.length === 1 ? "mesa" : "mesas"}
          </span>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="text-3xl" aria-hidden="true">
              🪑
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">
              Nenhuma mesa cadastrada
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre sua primeira mesa para começar a organizar o salão.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => (
              <article
                key={table.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {table.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {table.capacity}{" "}
                      {table.capacity === 1 ? "lugar" : "lugares"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[table.status]}`}
                  >
                    {statusLabels[table.status]}
                  </span>
                </div>

                {table.occupiedEntry && (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    Em atendimento: {table.occupiedEntry.name} · {table.occupiedEntry.partySize} {table.occupiedEntry.partySize === 1 ? "pessoa" : "pessoas"}
                  </p>
                )}

                {table.status === "occupied" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void handleRelease(table)}
                    className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirmar desocupação
                  </button>
                ) : (
                  <label className="mt-5 block space-y-1.5 text-sm font-medium text-slate-700">
                    Disponibilidade
                    <select
                      value={table.status}
                      disabled={pending}
                      onChange={(event) => void handleStatus(table.id, event.target.value as TableStatus)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                    >
                      {Object.entries(statusLabels).filter(([value]) => value !== "occupied").map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  type="button"
                  disabled={pending || table.status === "occupied"}
                  onClick={() => void handleDeactivate(table.id)}
                  className="mt-4 text-sm font-medium text-rose-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Desativar mesa
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Mesas desativadas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Recupere mesas que foram desativadas anteriormente.
          </p>
        </div>

        {inactiveTables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Nenhuma mesa desativada.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {inactiveTables.map((table) => (
              <article
                key={table.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">{table.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {table.capacity} {table.capacity === 1 ? "lugar" : "lugares"}
                </p>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void handleReactivate(table.id)}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  Reativar mesa
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}
