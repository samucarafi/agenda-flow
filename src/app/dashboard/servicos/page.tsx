import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Service } from "@/models/Service";

import { ServicesPage } from "@/components/dashboard/ServicesPage";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  await connectToDatabase();

  const services = await Service.find({
    userId: user.id,
  })
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

  return <ServicesPage services={serializedServices} />;
}
