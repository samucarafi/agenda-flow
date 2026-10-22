import { notFound, redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import RestaurantTable from "@/models/RestaurantTable";
import WaitlistEntry from "@/models/WaitlistEntry";
import TableManager from "./TableManager";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeading } from "@/components/dashboard/PageHeading";

type PageProps = {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function RestaurantTablesPage({ params, searchParams }: PageProps) {
  const [{ businessId }, query] = await Promise.all([params, searchParams]);

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
        <PageHeading
          eyebrow="Operação do restaurante"
          title="Gerenciamento de mesas"
          description="Organize a capacidade do salão e acompanhe a disponibilidade das mesas em um só lugar."
        />

        <TableManager
          key={`${tables.map((table) => table.id).join(",")}|${inactiveTables.map((table) => table.id).join(",")}`}
          businessId={businessId}
          initialTables={tables}
          initialInactiveTables={inactiveTables}
          continueToPublish={query.returnTo === "publish" && tables.length === 0}
        />
      </div>
    </DashboardLayout>
  );
}
