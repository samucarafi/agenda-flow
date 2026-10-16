import { notFound } from "next/navigation";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { Service } from "@/models/Service";
import { AgendaPage } from "@/components/dashboard/AgendaPage";

interface PageProps {
  params: Promise<{ businessId: string }>;
}

export default async function BusinessAgendaRoute({ params }: PageProps) {
  const { businessId } = await params;
  const access = await getOwnedBusiness(businessId);
  if (!access) notFound();

  await connectToDatabase();
  const [clients, services] = await Promise.all([
    Client.find({ businessId, active: true })
      .select("_id name")
      .sort({ name: 1 })
      .lean(),
    Service.find({ businessId, active: true })
      .select("_id name duration price")
      .sort({ name: 1 })
      .lean(),
  ]);

  return (
    <AgendaPage
      businessId={businessId}
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
