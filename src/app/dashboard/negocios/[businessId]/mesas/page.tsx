import { notFound, redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import RestaurantTable from "@/models/RestaurantTable";
import WaitlistEntry from "@/models/WaitlistEntry";
import TableManager from "./TableManager";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function RestaurantTablesPage({ params }: PageProps) {
  const { businessId } = await params;

  const access = await getOwnedBusiness(businessId);

  if (!access) {
    notFound();
  }

  if (access.business.category !== "restaurant") {
    redirect(`/dashboard/negocios/${businessId}/configuracoes`);
  }

  await connectToDatabase();

  const [documents, inactiveDocuments] = await Promise.all([
    RestaurantTable.find({
      businessId,
      active: true,
    })
      .sort({ createdAt: -1 })
      .lean(),

    RestaurantTable.find({
      businessId,
      active: false,
    })
      .sort({ updatedAt: -1 })
      .lean(),
  ]);

  const occupiedEntryIds = documents
    .map((table) => table.occupiedEntryId?.toString())
    .filter((id): id is string => Boolean(id));
  const occupiedTableIds = documents
    .filter((table) => table.status === "occupied")
    .map((table) => table._id);
  const occupiedEntries = occupiedTableIds.length
    ? await WaitlistEntry.find({
        businessId,
        $or: [
          { _id: { $in: occupiedEntryIds } },
          { tableId: { $in: occupiedTableIds } },
        ],
      })
        .select("_id customerName partySize tableId")
        .lean()
    : [];
  const entryById = new Map(
    occupiedEntries.map((entry) => [entry._id.toString(), entry]),
  );
  const entryByTableId = new Map(
    occupiedEntries.map((entry) => [entry.tableId?.toString(), entry]),
  );

  const tables = documents.map((table) => {
    const occupiedEntry = table.occupiedEntryId
      ? entryById.get(table.occupiedEntryId.toString())
      : entryByTableId.get(table._id.toString());

    return {
      id: table._id.toString(),
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      occupiedEntry: occupiedEntry
        ? { name: occupiedEntry.customerName, partySize: occupiedEntry.partySize }
        : null,
    };
  });

  const inactiveTables = inactiveDocuments.map((table) => ({
    id: table._id.toString(),
    name: table.name,
    capacity: table.capacity,
    status: table.status,
    occupiedEntry: null,
  }));

  return (
    <DashboardLayout
      title="Mesas"
      description={access.business.name}
      businessCategory="restaurant"
      showHeader={false}
    >
      <div className="space-y-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Operação do restaurante
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Gerenciamento de mesas
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Organize a capacidade do salão e acompanhe a disponibilidade das
            mesas em um só lugar.
          </p>
        </header>

        <TableManager
          businessId={businessId}
          initialTables={tables}
          initialInactiveTables={inactiveTables}
        />
      </div>
    </DashboardLayout>
  );
}
