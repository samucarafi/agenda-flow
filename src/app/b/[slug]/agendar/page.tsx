import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";
import { BookingForm } from "@/components/public/BookingForm";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { service: serviceId } = await searchParams;

  await connectToDatabase();

  const business = await Business.findOne({
    slug: slug.toLowerCase(),
    status: "active",
    "bookingSettings.enabled": true,
  })
    .select("_id name slug description category timezone theme bookingSettings")
    .lean();

  if (!business) notFound();

  const services = await Service.find({
    businessId: business._id,
    active: true,
  })
    .select("_id name description duration price")
    .sort({ name: 1 })
    .lean();

  if (services.length === 0) notFound();

  const selectedService =
    services.find((item) => item._id.toString() === serviceId) ?? services[0];

  const user = await getCurrentUser();

  if (!user) {
    const next = `/b/${business.slug}/agendar?service=${selectedService._id.toString()}`;
    redirect(`/entrar?next=${encodeURIComponent(next)}`);
  }

  if (user.role !== "client") {
    redirect("/dashboard/negocios");
  }

  const serializedBusiness = {
    id: business._id.toString(),
    name: business.name,
    slug: business.slug,
    description: business.description || "",
    category: business.category,
    primaryColor: business.theme?.primaryColor || "#0F172A",
    accentColor: business.theme?.accentColor || "#06B6D4",
  };

  const serializedServices = services.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    description: item.description || "",
    duration: item.duration,
    price: item.price,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <a
          href={`/b/${business.slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Voltar aos serviços
        </a>

        <header className="mt-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
            AgendaFlow · Agendamento online
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Agende seu horário
          </h1>
          <p className="mt-3 text-slate-400">
            {business.name}
            {business.description ? ` · ${business.description}` : ""}
          </p>
        </header>

        <div className="mt-8">
          <BookingForm
            business={serializedBusiness}
            services={serializedServices}
            initialServiceId={selectedService._id.toString()}
          />
        </div>
      </div>
    </main>
  );
}
