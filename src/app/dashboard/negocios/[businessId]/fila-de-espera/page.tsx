import { notFound, redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import WaitlistEntry from "@/models/WaitlistEntry";
import WaitlistManager from "./WaitlistManager";

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

  const documents = await WaitlistEntry.find({ businessId })
    .sort({ joinedAt: -1 })
    .limit(100)
    .lean();

  const entries = documents.map((entry) => ({
    id: entry._id.toString(),
    customerName: entry.customerName,
    phone: entry.phone ?? "",
    partySize: entry.partySize,
    position: entry.position,
    status: entry.status,
    joinedAt: entry.joinedAt.toISOString(),
    notes: entry.notes ?? "",
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
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
        </header>

        <WaitlistManager businessId={businessId} initialEntries={entries} />
      </div>
    </main>
  );
}
