import { notFound, redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import RestaurantTable from "@/models/RestaurantTable";
import TableManager from "./TableManager";

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

  const tables = documents.map((table) => ({
    id: table._id.toString(),
    name: table.name,
    capacity: table.capacity,
    status: table.status,
  }));

  const inactiveTables = inactiveDocuments.map((table) => ({
    id: table._id.toString(),
    name: table.name,
    capacity: table.capacity,
    status: table.status,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
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
    </main>
  );
}
