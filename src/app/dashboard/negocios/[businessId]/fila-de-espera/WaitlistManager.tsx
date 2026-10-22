"use client";
import WaitlistAutoRefresh from "./WaitlistAutoRefresh";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addRestaurantWaitlistEntry,
  updateRestaurantWaitlistStatus,
  seatRestaurantWaitlistEntry,
} from "@/actions/restaurant-waitlist";

type WaitStatus = "waiting" | "called" | "seated" | "completed" | "cancelled" | "no_show";

type AvailableTable = {
  id: string;
  name: string;
  capacity: number;
  recommendedEntry: { name: string; partySize: number } | null;
};

type Entry = {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  position: number;
  status: WaitStatus;
  joinedAt: string;
  notes: string;
};

const labels: Record<WaitStatus, string> = {
  waiting: "Aguardando",
  called: "Chamado",
  seated: "Acomodado",
  completed: "Atendimento concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const badgeStyles: Record<WaitStatus, string> = {
  waiting: "bg-amber-50 text-amber-800 ring-amber-200",
  called: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  seated: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-teal-50 text-teal-700 ring-teal-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  no_show: "bg-rose-50 text-rose-700 ring-rose-200",
};

type ActionResult = {
  success: boolean;
  error?: string;
  entryId?: string;
  position?: number;
};

export default function WaitlistManager({
  businessId,
  initialEntries,
  availableTables,
}: {
  businessId: string;
  initialEntries: Entry[];
  availableTables: AvailableTable[];
}) {
  const router = useRouter();
  const [selectedTables, setSelectedTables] = useState<Record<string, string>>(
    {},
  );
  const entries = initialEntries;
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const activeEntries = entries
    .filter((entry) => ["waiting", "called"].includes(entry.status))
    .sort((a, b) => a.position - b.position);

  const finishedEntries = entries.filter(
    (entry) => !["waiting", "called"].includes(entry.status),
  );

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("customerName", customerName);
    formData.set("notes", notes);
    formData.set("phone", phone);
    formData.set("partySize", partySize);

    try {
      const result = (await addRestaurantWaitlistEntry(
        formData,
      )) as ActionResult;

      if (!result.success) {
        setError(result.error ?? "Não foi possível adicionar o grupo.");
        return;
      }

      setMessage(
        `Grupo adicionado à fila${result.position ? ` na posição ${result.position}` : ""}.`,
      );
      setCustomerName("");
      setPhone("");
      setPartySize("2");
      setNotes("");

      // Sincroniza a lista com o banco e as posições recalculadas.
      router.refresh();
    } catch {
      setError("Ocorreu um erro ao adicionar o grupo.");
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(entry: Entry, status: WaitStatus) {
    setPending(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("entryId", entry.id);
    formData.set("status", status);

    try {
      const result = (await updateRestaurantWaitlistStatus(
        formData,
      )) as ActionResult;

      if (!result.success) {
        setError(result.error ?? "Não foi possível atualizar o grupo.");
        return;
      }

      setMessage(`Status de ${entry.customerName} atualizado.`);
      router.refresh();
    } catch {
      setError("Ocorreu um erro ao atualizar a fila.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary label="Na fila" value={activeEntries.length} />
        <Summary
          label="Aguardando"
          value={
            activeEntries.filter((entry) => entry.status === "waiting").length
          }
        />
        <Summary
          label="Já acomodados"
          value={entries.filter((entry) => entry.status === "seated" || entry.status === "completed").length}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Adicionar grupo
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre os dados do grupo para organizar a ordem de atendimento.
        </p>

        <form onSubmit={submitEntry} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Nome do responsável
            <input
              required
              minLength={2}
              maxLength={100}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Nome do cliente"
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Telefone (opcional)
            <input
              maxLength={30}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="(21) 99999-9999"
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Pessoas
            <input
              required
              type="number"
              min={1}
              max={40}
              value={partySize}
              onChange={(event) => setPartySize(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Observações (opcional)
            <input
              maxLength={300}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Preferência ou observação"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {pending ? "Salvando..." : "Adicionar à fila"}
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
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Fila atual
        </h2>
        <WaitlistAutoRefresh />
        {activeEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-semibold text-slate-900">Fila vazia</h3>
            <p className="mt-1 text-sm text-slate-500">
              Os novos grupos aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
                      {entry.position}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {entry.customerName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {entry.partySize}{" "}
                        {entry.partySize === 1 ? "pessoa" : "pessoas"}
                        {entry.phone ? ` · ${entry.phone}` : ""}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${badgeStyles[entry.status]}`}
                      >
                        {labels[entry.status]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.status === "waiting" && (
                      <button
                        disabled={pending}
                        onClick={() => void changeStatus(entry, "called")}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Chamar
                      </button>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Mesa para ${entry.customerName}`}
                        value={selectedTables[entry.id] ?? ""}
                        disabled={pending}
                        onChange={(event) =>
                          setSelectedTables((current) => ({
                            ...current,
                            [entry.id]: event.target.value,
                          }))
                        }
                        className="min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecionar mesa</option>
                        {availableTables
                          .filter((table) => table.capacity >= entry.partySize)
                          .map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.name} · {table.capacity} lugares{table.recommendedEntry ? ` · sugestão: ${table.recommendedEntry.name}` : ""}
                            </option>
                          ))}
                      </select>

                      <button
                        type="button"
                        disabled={pending || !selectedTables[entry.id]}
                        onClick={async () => {
                          setPending(true);
                          setError("");
                          setMessage("");

                          const formData = new FormData();
                          formData.set("businessId", businessId);
                          formData.set("entryId", entry.id);
                          formData.set("tableId", selectedTables[entry.id]);

                          try {
                            const result =
                              await seatRestaurantWaitlistEntry(formData);

                            if (!result.success) {
                              setError(
                                result.error ??
                                  "Não foi possível acomodar o grupo.",
                              );
                              return;
                            }

                            setMessage(`${entry.customerName} foi acomodado.`);
                            router.refresh();
                          } catch {
                            setError("Ocorreu um erro ao acomodar o grupo.");
                          } finally {
                            setPending(false);
                          }
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirmar mesa
                      </button>
                    </div>

                    <button
                      disabled={pending}
                      onClick={() => void changeStatus(entry, "cancelled")}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      disabled={pending}
                      onClick={() => void changeStatus(entry, "no_show")}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Não compareceu
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {finishedEntries.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Histórico recente
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {finishedEntries.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {entry.customerName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {entry.partySize}{" "}
                    {entry.partySize === 1 ? "pessoa" : "pessoas"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${badgeStyles[entry.status]}`}
                >
                  {labels[entry.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
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
