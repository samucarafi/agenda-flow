import { notFound, redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import WaitlistEntry from "@/models/WaitlistEntry";
import WaitlistManager from "./WaitlistManager";
import RestaurantTable from "@/models/RestaurantTable";
import { recommendWaitlistEntry } from "@/lib/waitlist-rules.mjs";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { reconcileSeatedEntry } from "@/lib/reconcile-seated-entry";
import { PageHeading } from "@/components/dashboard/PageHeading";

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function RestaurantWaitlistPage({ params }: PageProps) {
  const { businessId } = await params;

  const access = await getOwnedBusiness(businessId);

  if (!access) {
    notFound();
  }

  if (access.business.category !== "restaurant") {
    redirect(`/dashboard/negocios/${businessId}/configuracoes`);
  }

  await connectToDatabase();

  const [activeDocuments, finishedDocuments] = await Promise.all([
    WaitlistEntry.find({ businessId, status: { $in: ["waiting", "called"] } })
      .sort({ joinedAt: 1, _id: 1 })
      .lean(),
    WaitlistEntry.find({ businessId, status: { $in: ["seated", "completed", "cancelled", "no_show"] } })
      .sort({ joinedAt: -1 })
      .limit(50)
      .lean(),
  ]);
  const finishedStatuses = await Promise.all(
    finishedDocuments.map((entry) => reconcileSeatedEntry(entry)),
  );
  const positionByEntryId = new Map(
    activeDocuments.map((entry, index) => [entry._id.toString(), index + 1]),
  );

  const availableTables = await RestaurantTable.find({
    businessId,
    active: true,
    status: "available",
  })
    .select("_id name capacity")
    .sort({ capacity: 1, name: 1 })
    .lean();

  const activeEntries = activeDocuments;
  const serializedTables = availableTables.map((table) => {
    const recommendedEntry = recommendWaitlistEntry(
      activeEntries.map((entry) => ({
        id: entry._id.toString(),
        partySize: entry.partySize,
        joinedAt: entry.joinedAt,
        status: entry.status,
        customerName: entry.customerName,
      })),
      table.capacity,
    );

    return {
      id: table._id.toString(),
      name: table.name,
      capacity: table.capacity,
      recommendedEntry: recommendedEntry
        ? {
            name: recommendedEntry.customerName ?? "Grupo da fila",
            partySize: recommendedEntry.partySize,
          }
        : null,
    };
  });

  const entries = [...activeDocuments, ...finishedDocuments].map((entry, index) => ({
    id: entry._id.toString(),
    customerName: entry.customerName,
    phone: entry.phone ?? "",
    partySize: entry.partySize,
    position: positionByEntryId.get(entry._id.toString()) ?? entry.position,
    status:
      index >= activeDocuments.length
        ? finishedStatuses[index - activeDocuments.length]
        : entry.status,
    joinedAt: entry.joinedAt.toISOString(),
    notes: entry.notes ?? "",
  }));

  return (
    <DashboardLayout
      title="Fila de espera"
      description={access.business.name}
      businessCategory="restaurant"
      showHeader={false}
    >
      <div className="space-y-8">
        <PageHeading
          eyebrow="Operação do restaurante"
          title="Fila de espera"
          description="Organize a ordem de atendimento, acompanhe os grupos e registre quando forem acomodados."
          actions={(
            <Link
              href={`/b/${access.business.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-auto"
            >
              Abrir página pública ↗
            </Link>
          )}
        />

        <WaitlistManager
          businessId={businessId}
          initialEntries={entries}
          availableTables={serializedTables}
        />
      </div>
    </DashboardLayout>
  );
}
