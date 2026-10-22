import { notFound, redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import WaitlistEntry from "@/models/WaitlistEntry";
import WaitlistManager from "./WaitlistManager";
import RestaurantTable from "@/models/RestaurantTable";
import { recommendWaitlistEntry } from "@/lib/waitlist-rules.mjs";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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

  const entries = [...activeDocuments, ...finishedDocuments].map((entry) => ({
    id: entry._id.toString(),
    customerName: entry.customerName,
    phone: entry.phone ?? "",
    partySize: entry.partySize,
    position: positionByEntryId.get(entry._id.toString()) ?? entry.position,
    status: entry.status,
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
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
          <p className="text-sm font-medium text-indigo-600">
            Operação do restaurante
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Fila de espera
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Organize a ordem de atendimento, acompanhe os grupos e registre
            quando forem acomodados.
          </p>
          </div>
          <Link
            href={`/b/${access.business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Abrir página pública ↗
          </Link>
        </header>

        <WaitlistManager
          businessId={businessId}
          initialEntries={entries}
          availableTables={serializedTables}
        />
      </div>
    </DashboardLayout>
  );
}
