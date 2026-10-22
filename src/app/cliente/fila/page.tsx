import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import WaitlistEntry from "@/models/WaitlistEntry";
import QueueAutoRefresh from "./QueueAutoRefresh";
import LeaveQueueButton from "./LeaveQueueButton";
import QueueHistory from "./QueueHistory";
import mongoose from "mongoose";
import "@/models/RestaurantTable";
import { ClientAreaLayout } from "@/components/client/ClientAreaLayout";
import { reconcileSeatedEntry } from "@/lib/reconcile-seated-entry";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  waiting: "Aguardando",
  called: "Você foi chamado!",
  seated: "Acomodado",
  completed: "Atendimento concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default async function ClientQueuePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "client") redirect("/dashboard");

  await connectToDatabase();

  const userObjectId = new mongoose.Types.ObjectId(user.id);

  const entries = await WaitlistEntry.find({
    userId: userObjectId,
  })
    .sort({ joinedAt: -1 })
    .limit(50)
    .populate("businessId", "name slug")
    .populate("tableId", "name")
    .lean();
  const reconciledStatuses = await Promise.all(
    entries.map((entry) => reconcileSeatedEntry(entry)),
  );

  const businessIds = [
    ...new Set(
      entries
        .map((entry) => {
          const business = entry.businessId as unknown as {
            _id?: mongoose.Types.ObjectId;
          };
          return business?._id?.toString();
        })
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const activeQueueEntries = businessIds.length
    ? await WaitlistEntry.find({
        businessId: { $in: businessIds },
        status: { $in: ["waiting", "called"] },
      })
        .sort({ businessId: 1, joinedAt: 1, _id: 1 })
        .select("_id businessId")
        .lean()
    : [];
  const positions = new Map<string, number>();
  let previousBusinessId = "";
  let businessPosition = 0;
  for (const entry of activeQueueEntries) {
    const currentBusinessId = entry.businessId.toString();
    businessPosition =
      currentBusinessId === previousBusinessId ? businessPosition + 1 : 1;
    positions.set(
      `${currentBusinessId}:${entry._id.toString()}`,
      businessPosition,
    );
    previousBusinessId = currentBusinessId;
  }

  const serializedEntries = entries.map((entry, index) => {
    const business = entry.businessId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
    } | null;

    const table = entry.tableId as unknown as {
      name: string;
    } | null;

    return {
      id: entry._id.toString(),
      businessId: business?._id?.toString() ?? null,
      businessName: business?.name ?? "Restaurante",
      businessSlug: business?.slug ?? null,
      customerName: entry.customerName,
      partySize: entry.partySize,
      position:
        positions.get(
          `${business?._id?.toString() ?? ""}:${entry._id.toString()}`,
        ) ?? entry.position,
      status: reconciledStatuses[index],
      joinedAt: entry.joinedAt.toISOString(),
      tableName: reconciledStatuses[index] === "seated" ? table?.name ?? null : null,
    };
  });

  const activeEntries = serializedEntries.filter((entry) =>
    ["waiting", "called"].includes(entry.status),
  );

  const history = serializedEntries.filter(
    (entry) => !["waiting", "called"].includes(entry.status),
  );

  return (
    <ClientAreaLayout width="standard">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-300">
              AGENDAFLOW · ÁREA DO CLIENTE
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Minha fila
            </h1>
            <p className="mt-2 text-slate-300">
              Acompanhe suas entradas e veja quando for chamado.
            </p>
          </div>

        </header>

        <div className="mt-4">
          <QueueAutoRefresh />
        </div>

        <section className="mt-6 space-y-4">
          {activeEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
              <h2 className="font-semibold text-white">
                Você não está em nenhuma fila ativa
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Acesse a página pública de um restaurante para entrar na fila.
              </p>
            </div>
          ) : (
            activeEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-300">
                      {entry.businessName}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      {statusLabels[entry.status] ?? entry.status}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Grupo de {entry.partySize}{" "}
                      {entry.partySize === 1 ? "pessoa" : "pessoas"}
                    </p>
                    {entry.tableName && (
                      <p className="mt-1 text-sm font-medium text-emerald-300">
                        Mesa: {entry.tableName}
                      </p>
                    )}
                  </div>

                  {entry.status === "waiting" && (
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-4 text-center">
                      <p className="text-xs font-medium uppercase tracking-wide text-cyan-200">
                        Sua posição
                      </p>
                      <p className="mt-1 text-4xl font-bold text-white">
                        {entry.position}
                      </p>
                    </div>
                  )}

                  {entry.status === "called" && (
                    <div
                      role="status"
                      className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 font-semibold text-amber-200"
                    >
                      Procure a equipe do restaurante.
                    </div>
                  )}

                  {entry.businessSlug && (
                    <Link
                      href={`/b/${entry.businessSlug}/fila`}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Acompanhar fila deste restaurante
                    </Link>
                  )}

                  {entry.businessId && (
                    <LeaveQueueButton
                      businessId={entry.businessId}
                      businessName={entry.businessName}
                    />
                  )}
                </div>

                {entry.businessSlug && (
                  <Link
                    href={`/b/${entry.businessSlug}`}
                    className="mt-5 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Ver restaurante →
                  </Link>
                )}
              </article>
            ))
          )}
        </section>

        <QueueHistory entries={history} statusLabels={statusLabels} />
    </ClientAreaLayout>
  );
}
