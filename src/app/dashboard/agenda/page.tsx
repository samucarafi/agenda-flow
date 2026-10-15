import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

import { Client } from "@/models/Client";
import { Service } from "@/models/Service";

import { AgendaPage } from "@/components/dashboard/AgendaPage";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  await connectToDatabase();

  const [clients, services] = await Promise.all([
    Client.find({
      userId: user.id,
      active: true,
    })
      .select("_id name")
      .sort({ name: 1 })
      .lean(),

    Service.find({
      userId: user.id,
      active: true,
    })
      .select("_id name duration price")
      .sort({ name: 1 })
      .lean(),
  ]);

  return (
    <AgendaPage
      clients={clients.map((client) => ({
        _id: client._id.toString(),
        name: client.name,
      }))}
      services={services.map((service) => ({
        _id: service._id.toString(),
        name: service.name,
        duration: service.duration,
        price: service.price,
      }))}
    />
  );
}
