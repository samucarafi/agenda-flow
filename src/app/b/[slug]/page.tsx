import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiClock, FiMapPin } from "react-icons/fi";

import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const categoryLabels: Record<string, string> = {
  barbershop: "Barbearia",
  beauty_salon: "Salão de beleza",
  restaurant: "Restaurante",
  other: "Estabelecimento",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function PublicBusinessPage({ params }: PageProps) {
  const { slug } = await params;

  await connectToDatabase();

  const business = await Business.findOne({
    slug: slug.toLowerCase(),
    status: "active",
    "bookingSettings.enabled": true,
  })
    .select(
      "name slug category description address location timezone theme bookingSettings gallery",
    )
    .lean();

  if (!business) {
    notFound();
  }

  const services = await Service.find({
    businessId: business._id,
    active: true,
  })
    .select("name description duration price")
    .sort({ name: 1 })
    .lean();

  const primaryColor =
    typeof business.theme?.primaryColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(business.theme.primaryColor)
      ? business.theme.primaryColor
      : "#0F172A";

  const accentColor =
    typeof business.theme?.accentColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(business.theme.accentColor)
      ? business.theme.accentColor
      : "#06B6D4";

  const location = business.location;

  // Monta o endereço com os dados estruturados salvos no banco.
  // O campo address é usado como alternativa para registros antigos.
  const publicAddress =
    [
      location?.street
        ? `${location.street}${location.number ? `, ${location.number}` : ""}`
        : "",
      location?.complement,
      location?.district,
      location?.city && location?.state
        ? `${location.city} - ${location.state}`
        : location?.city || location?.state,
      location?.postalCode
        ? `CEP ${String(location.postalCode).replace(/\D/g, "")}`
        : "",
      location?.reference ? `Referência: ${location.reference}` : "",
    ]
      .filter(
        (part): part is string =>
          typeof part === "string" && part.trim().length > 0,
      )
      .join(", ") ||
    (typeof business.address === "string" ? business.address : "");

  const mapsSearchUrl = publicAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(publicAddress)}`
    : "";

  const mapsEmbedUrl = publicAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(publicAddress)}&output=embed`
    : "";

  return (
    <main
      className="min-h-screen text-white"
      style={
        {
          "--business-primary": primaryColor,
          "--business-accent": accentColor,
          backgroundColor: primaryColor,
        } as React.CSSProperties
      }
    >
      <header className="border-b border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/cliente"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <FiArrowLeft aria-hidden="true" />
            Área do cliente
          </Link>

          <span
            className="text-xs font-bold tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            AGENDAFLOW
          </span>
        </div>
      </header>

      {/* Apresentação do estabelecimento */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at top right, ${accentColor}, transparent 60%)`,
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold" style={{ color: accentColor }}>
            {categoryLabels[business.category] ?? "Estabelecimento"}
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {business.name}
          </h1>

          {business.description && (
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              {business.description}
            </p>
          )}

          <p className="mt-5 flex items-center gap-2 text-sm text-slate-400">
            <FiClock aria-hidden="true" style={{ color: accentColor }} />
            Atendimento com horário agendado
          </p>

          {publicAddress && (
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex max-w-full items-start gap-2 text-sm text-slate-300 underline-offset-4 transition hover:text-white hover:underline"
            >
              <FiMapPin
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: accentColor }}
              />
              <span className="break-words">{publicAddress}</span>
            </a>
          )}
        </div>
      </section>

      {/* Localização e mapa */}
      {publicAddress && (
        <section
          aria-labelledby="location-heading"
          className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
        >
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p
                className="text-sm font-semibold tracking-[0.18em]"
                style={{ color: accentColor }}
              >
                COMO CHEGAR
              </p>

              <h2
                id="location-heading"
                className="mt-2 text-2xl font-bold sm:text-3xl"
              >
                Visite nosso espaço
              </h2>

              <p className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-300">
                <FiMapPin
                  aria-hidden="true"
                  size={20}
                  className="mt-0.5 shrink-0"
                  style={{ color: accentColor }}
                />
                <span className="break-words">{publicAddress}</span>
              </p>

              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ backgroundColor: accentColor }}
              >
                <FiMapPin aria-hidden="true" size={17} />
                Abrir no Google Maps
                <FiArrowRight aria-hidden="true" size={16} />
              </a>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Confira o endereço no Google Maps antes de sair. A localização
                exibida depende dos dados de endereço cadastrados.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/10">
              <iframe
                title={`Mapa de localização de ${business.name}`}
                src={mapsEmbedUrl}
                className="h-72 w-full sm:h-80 lg:h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Galeria de fotos */}
      {(business.gallery?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div className="mb-6">
            <p
              className="text-sm font-semibold tracking-[0.18em]"
              style={{ color: accentColor }}
            >
              CONHEÇA NOSSO ESPAÇO
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Fotos do estabelecimento
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {business.gallery.map((image) => (
              <figure
                key={image.publicId}
                className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${
                  image.isCover ? "col-span-2 row-span-2" : ""
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Foto do estabelecimento ${business.name}`}
                  width={1200}
                  height={900}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="h-full min-h-36 w-full object-cover transition duration-500 hover:scale-[1.02]"
                />
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Catálogo de serviços */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-7">
          <p
            className="text-sm font-semibold tracking-[0.18em]"
            style={{ color: accentColor }}
          >
            NOSSO CATÁLOGO
          </p>

          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Escolha seu serviço
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Confira as opções, a duração e o preço antes de continuar.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h3 className="font-semibold">Nenhum serviço disponível ainda</h3>

            <p className="mt-2 text-sm text-slate-400">
              Este estabelecimento ainda não publicou seus serviços.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service._id.toString()}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{service.name}</h3>

                  {service.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {service.description}
                    </p>
                  )}

                  <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                    <FiClock
                      aria-hidden="true"
                      style={{ color: accentColor }}
                    />
                    {service.duration} minutos
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="text-lg font-bold">
                    {currency.format(service.price)}
                  </span>

                  <Link
                    href={`/b/${business.slug}/agendar?service=${service._id.toString()}`}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Agendar
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-slate-500">
        Agendamentos organizados com AgendaFlow.
      </footer>
    </main>
  );
}
