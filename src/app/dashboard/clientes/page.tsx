import { connectToDatabase } from "@/lib/mongodb";
import { Client } from "@/models/Client";

import { ClientsPage } from "@/components/dashboard/ClientsPage";

export default async function Page() {
  await connectToDatabase();

  const clients = await Client.find({
    active: true,
  })
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

  return <ClientsPage clients={serializedClients} />;
}
