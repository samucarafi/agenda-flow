import { notFound, redirect } from "next/navigation";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/models/Client";
import { ClientsPage } from "@/components/dashboard/ClientsPage";

interface PageProps {
  params: Promise<{ businessId: string }>;
}

export default async function BusinessClientsRoute({ params }: PageProps) {
  const { businessId } = await params;
  const access = await getOwnedBusiness(businessId);

  if (!access) notFound();
  if (access.business.category === "restaurant") {
    redirect(`/dashboard/negocios/${businessId}/fila-de-espera`);
  }

  await connectToDatabase();

  const clients = await Client.find({ businessId, active: true })
    .sort({ createdAt: -1 })
    .lean();

  const serializedClients = clients.map((client) => ({
    _id: client._id.toString(),
    name: client.name,
    email: client.email,
    phone: client.phone,
    active: client.active,
    createdAt: client.createdAt.toISOString(),
  }));

  return <ClientsPage businessId={businessId} clients={serializedClients} />;
}
