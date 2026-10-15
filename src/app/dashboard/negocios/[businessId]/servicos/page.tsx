import { notFound } from "next/navigation";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import Service from "@/models/Service";
import { ServicesPage } from "@/components/dashboard/ServicesPage";

interface PageProps {
  params: Promise<{ businessId: string }>;
}

export default async function BusinessServicesRoute({ params }: PageProps) {
  const { businessId } = await params;
  const access = await getOwnedBusiness(businessId);

  if (!access) notFound();

  await connectToDatabase();

  const services = await Service.find({ businessId })
    .sort({ active: -1, createdAt: -1 })
    .lean();

  const serializedServices = services.map((service) => ({
    _id: service._id.toString(),
    name: service.name,
    description: service.description ?? "",
    duration: service.duration,
    price: service.price,
    active: service.active,
    createdAt: service.createdAt.toISOString(),
  }));

  return <ServicesPage businessId={businessId} services={serializedServices} />;
}
