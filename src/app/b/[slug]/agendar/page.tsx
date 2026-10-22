import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";
import { BookingForm } from "@/components/public/BookingForm";
import { PublicBusinessNavigation } from "@/components/navigation/PublicBusinessNavigation";
import { getBusinessTheme } from "@/lib/business-theme";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; preview?: string }>;
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { service: serviceId, preview } = await searchParams;

  await connectToDatabase();

  const business = await Business.findOne({
    slug: slug.toLowerCase(),
    status: "active",
    category: { $ne: "restaurant" },
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
  const theme = getBusinessTheme(business.theme);
  const surface = `color-mix(in srgb, ${theme.primaryColor} 94%, ${theme.primaryText})`;
  const border = theme.template === "bold"
    ? `color-mix(in srgb, ${theme.accentColor} 42%, transparent)`
    : `color-mix(in srgb, ${theme.primaryText} ${theme.template === "minimal" ? 12 : 16}%, transparent)`;

  const user = await getCurrentUser();

  if (!user) {
    const next = `/b/${business.slug}/agendar?service=${selectedService._id.toString()}`;
    redirect(`/entrar?next=${encodeURIComponent(next)}`);
  }

  const previewMode = user.role === "owner" && preview === "1";

  if (user.role !== "client" && !previewMode) {
    redirect("/dashboard/negocios");
  }

  const serializedBusiness = {
    id: business._id.toString(),
    name: business.name,
    slug: business.slug,
    description: business.description || "",
    category: business.category,
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    template: theme.template,
    primaryText: theme.primaryText,
    accentText: theme.accentText,
    accentLabelColor: theme.accentLabelColor,
  };

  const serializedServices = services.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    description: item.description || "",
    duration: item.duration,
    price: item.price,
  }));

  return (
    <main
      className="business-public-page min-h-screen text-white"
      data-template={theme.template}
      style={{
        background: theme.template === "minimal"
          ? theme.primaryColor
          : theme.template === "bold"
            ? `linear-gradient(135deg, ${theme.primaryColor}, color-mix(in srgb, ${theme.primaryColor} 78%, ${theme.accentColor}))`
            : `linear-gradient(145deg, ${theme.primaryColor}, color-mix(in srgb, ${theme.primaryColor} 94%, ${theme.accentColor}))`,
        color: theme.primaryText,
        "--business-surface": surface,
        "--business-border": border,
        "--business-radius": theme.template === "minimal" ? "1rem" : theme.template === "bold" ? "1.5rem" : "1.125rem",
        "--business-text": theme.primaryText,
        "--business-control-surface": `color-mix(in srgb, ${theme.primaryColor} 88%, ${theme.primaryText})`,
      } as React.CSSProperties}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <PublicBusinessNavigation
          slug={business.slug}
          category={business.category}
          bookingEnabled={business.bookingSettings?.enabled ?? false}
          current="booking"
          accentColor={theme.accentColor}
          accentText={theme.accentText}
          foregroundColor={theme.primaryText}
        />

        <header className="mt-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accentLabelColor }}>
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
            previewMode={previewMode}
          />
        </div>
      </div>
    </main>
  );
}
