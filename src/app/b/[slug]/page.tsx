import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowRight, FiClock, FiMapPin } from "react-icons/fi";

import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { PublicBusinessNavigation } from "@/components/navigation/PublicBusinessNavigation";
import { getBusinessTheme } from "@/lib/business-theme";

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
  })
    .select(
      "name slug category description address timezone theme bookingSettings gallery",
    )
    .lean();

  if (!business) {
    notFound();
  }

  const [services, menuCategories, menuItems] = await Promise.all([
    business.category === "restaurant"
      ? Promise.resolve([])
      : Service.find({ businessId: business._id, active: true })
          .select("name description duration price")
          .sort({ name: 1 })
          .lean(),
    business.category === "restaurant"
      ? MenuCategory.find({ businessId: business._id, active: true })
          .sort({ sortOrder: 1, name: 1 })
          .lean()
      : Promise.resolve([]),
    business.category === "restaurant"
      ? MenuItem.find({ businessId: business._id, available: true })
          .sort({ sortOrder: 1, name: 1 })
          .lean()
      : Promise.resolve([]),
  ]);
  const categoriesWithItems = menuCategories.filter((category) =>
    menuItems.some((item) => item.categoryId.toString() === category._id.toString()),
  );

  const {
    template,
    primaryColor,
    accentColor,
    primaryText,
    accentText,
    accentLabelColor,
  } = getBusinessTheme(business.theme);
  const businessSurface = `color-mix(in srgb, ${primaryColor} 94%, ${primaryText})`;
  const businessBorder = template === "bold"
    ? `color-mix(in srgb, ${accentColor} 42%, transparent)`
    : `color-mix(in srgb, ${primaryText} ${template === "minimal" ? 12 : 16}%, transparent)`;
  const businessRadius = template === "minimal" ? "1rem" : template === "bold" ? "1.5rem" : "1.125rem";

  const publicAddress = [
    business.address?.street
      ? `${business.address.street}${
          business.address.number ? `, ${business.address.number}` : ""
        }`
      : "",
    business.address?.complement,
    business.address?.neighborhood,
    business.address?.city && business.address?.state
      ? `${business.address.city} - ${business.address.state}`
      : business.address?.city || business.address?.state,
    business.address?.zipCode
      ? `CEP ${String(business.address.zipCode).replace(/\D/g, "")}`
      : "",
  ]
    .filter(
      (part): part is string =>
        typeof part === "string" && part.trim().length > 0,
    )
    .join(", ");

  const mapsSearchUrl = publicAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(publicAddress)}`
    : "";

  const mapsEmbedUrl = publicAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(publicAddress)}&output=embed`
    : "";

  return (
    <main
      className="business-public-page min-h-screen text-white"
      style={
        {
          "--business-primary": primaryColor,
          "--business-accent": accentColor,
          "--business-surface": businessSurface,
          "--business-border": businessBorder,
          "--business-radius": businessRadius,
          "--business-text": primaryText,
          "--business-control-surface": `color-mix(in srgb, ${primaryColor} 88%, ${primaryText})`,
          background: template === "minimal"
            ? primaryColor
            : template === "bold"
              ? `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor} 78%, ${accentColor}))`
              : `linear-gradient(145deg, ${primaryColor}, color-mix(in srgb, ${primaryColor} 94%, ${accentColor}))`,
          color: primaryText,
        } as React.CSSProperties
      }
      data-template={template}
    >
      <header className="border-b border-current/10 bg-current/[0.02]" data-business-surface>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="text-xs font-bold tracking-[0.2em]" style={{ color: accentLabelColor }}>AGENDAFLOW</span>
          <Link href="/cliente" className="text-sm opacity-80 transition hover:opacity-100">Área do cliente</Link>
        </div>
      </header>

      {/* Apresentação do estabelecimento */}
      <section className="relative overflow-hidden border-b border-current/10" data-business-hero>
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${template === "minimal" ? "opacity-0" : template === "bold" ? "opacity-35" : "opacity-20"}`}
          style={{
            background: `radial-gradient(ellipse at top right, ${accentColor}, transparent 60%)`,
          }}
        />

        <div className={`relative mx-auto max-w-6xl px-4 sm:px-6 ${template === "bold" ? "py-20 sm:py-28" : template === "minimal" ? "py-12 sm:py-16" : "py-14 sm:py-20"}`}>
          <p className="text-sm font-semibold" style={{ color: accentLabelColor }}>
            {categoryLabels[business.category] ?? "Estabelecimento"}
          </p>

          <h1 className={`mt-3 max-w-3xl font-bold tracking-tight ${template === "bold" ? "text-5xl sm:text-7xl" : "text-4xl sm:text-5xl"}`}>
            {business.name}
          </h1>

          {business.description && (
            <p className="mt-4 max-w-2xl text-base leading-7 opacity-80">
              {business.description}
            </p>
          )}

          <p className="mt-5 flex items-center gap-2 text-sm opacity-70">
            <FiClock aria-hidden="true" style={{ color: accentLabelColor }} />
            {business.category === "restaurant" ? "Cardápio e fila de espera" : "Atendimento com horário agendado"}
          </p>

          <div className="mt-7 max-w-3xl">
            <PublicBusinessNavigation
              slug={business.slug}
              category={business.category}
              bookingEnabled={business.bookingSettings?.enabled ?? false}
              current="home"
              accentColor={accentColor}
              accentText={accentText}
              foregroundColor={primaryText}
            />
          </div>

          {business.category === "restaurant" && (
            <div data-business-surface className="mt-8 max-w-xl rounded-2xl border border-current/15 bg-current/[0.04] p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Quer uma mesa?</h2>
              <p className="mt-1 text-sm leading-6 opacity-75">Entre na fila e acompanhe sua posição pelo celular.</p>
              <Link
                href={`/b/${business.slug}/fila`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                style={{ backgroundColor: accentColor, color: accentText }}
              >
                Entrar na fila de espera <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
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
                style={{ color: accentLabelColor }}
              >
                COMO CHEGAR
              </p>

              <h2
                id="location-heading"
                className="mt-2 text-2xl font-bold sm:text-3xl"
              >
                Visite nosso espaço
              </h2>

              <p className="mt-4 flex items-start gap-3 text-sm leading-6 opacity-80">
                <FiMapPin
                  aria-hidden="true"
                  size={20}
                  className="mt-0.5 shrink-0"
                style={{ color: accentLabelColor }}
                />
                <span className="break-words">{publicAddress}</span>
              </p>

              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                style={{ backgroundColor: accentColor, color: accentText }}
              >
                <FiMapPin aria-hidden="true" size={17} />
                Abrir no Google Maps
                <FiArrowRight aria-hidden="true" size={16} />
              </a>

              <p className="mt-3 text-xs leading-5 opacity-60">
                Confira o endereço no Google Maps antes de sair. A localização
                exibida depende dos dados de endereço cadastrados.
              </p>
            </div>

            <div data-business-surface className="overflow-hidden rounded-2xl border border-current/10 bg-current/[0.04] shadow-2xl shadow-black/10">
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
              style={{ color: accentLabelColor }}
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
                data-business-surface
                className={`overflow-hidden rounded-2xl border border-current/10 bg-current/[0.04] ${
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

      {business.category === "restaurant" ? (
      <section id="cardapio" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-7">
              <p className="text-sm font-semibold tracking-[0.18em]" style={{ color: accentLabelColor }}>CARDÁPIO</p>
          <h2 data-business-section-title className="mt-2 text-2xl font-bold sm:text-3xl">Menu digital</h2>
          <p className="mt-2 text-sm opacity-70">Confira os itens disponíveis antes de visitar o restaurante.</p>
        </div>
        {categoriesWithItems.length === 0 ? (
          <div data-business-surface className="rounded-2xl border border-current/10 bg-current/[0.04] p-8 text-center">
            <h3 className="font-semibold">Cardápio em preparação</h3>
            <p className="mt-2 text-sm opacity-70">O restaurante ainda não publicou itens do menu.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categoriesWithItems.map((category) => {
              const items = menuItems.filter((item) => item.categoryId.toString() === category._id.toString());
              if (!items.length) return null;
              return (
                <section key={category._id.toString()} aria-labelledby={`menu-${category._id.toString()}`}>
                  <div className="mb-3">
                    <h3 id={`menu-${category._id.toString()}`} className="text-xl font-semibold">{category.name}</h3>
                    {category.description && <p className="mt-1 text-sm opacity-70">{category.description}</p>}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.map((item) => (
                      <article data-business-surface key={item._id.toString()} className="overflow-hidden rounded-2xl border border-current/10 bg-current/[0.04]">
                        {item.imageUrl && (
                          <div className="relative aspect-[16/9] w-full bg-current/5">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            {item.description && <p className="mt-2 text-sm leading-6 opacity-70">{item.description}</p>}
                          </div>
                          <span className="shrink-0 text-sm font-semibold" style={{ color: accentLabelColor }}>
                            {typeof item.price === "number" ? currency.format(item.price) : "Consulte"}
                          </span>
                        </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
      ) : (
      <section id="servicos" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-7">
              <p
            className="text-sm font-semibold tracking-[0.18em]"
                style={{ color: accentLabelColor }}
          >
            NOSSOS SERVIÇOS
          </p>

          <h2 data-business-section-title className="mt-2 text-2xl font-bold sm:text-3xl">
            Escolha seu serviço
          </h2>

          <p className="mt-2 text-sm opacity-70">
            Confira as opções, a duração e o preço antes de continuar.
          </p>
        </div>
        {services.length === 0 ? (
          <div data-business-surface className="rounded-2xl border border-current/10 bg-current/[0.04] p-8 text-center">
            <h3 className="font-semibold">Nenhum serviço disponível ainda</h3>

            <p className="mt-2 text-sm opacity-70">
              Este estabelecimento ainda não publicou seus serviços.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service._id.toString()}
                data-business-surface
                className="flex flex-col rounded-2xl border border-current/10 bg-current/[0.04] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-current/20 hover:bg-current/[0.07]"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{service.name}</h3>

                  {service.description && (
                    <p className="mt-2 text-sm leading-6 opacity-70">
                      {service.description}
                    </p>
                  )}

                  <p className="mt-4 flex items-center gap-2 text-sm opacity-70">
                    <FiClock
                      aria-hidden="true"
                      style={{ color: accentLabelColor }}
                    />
                    {service.duration} minutos
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-current/10 pt-4">
                  <span className="text-lg font-bold">
                    {currency.format(service.price)}
                  </span>

                  <Link
                    href={`/b/${business.slug}/agendar?service=${service._id.toString()}`}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                    style={{ backgroundColor: accentColor, color: accentText }}
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
      )}

      <footer className="border-t border-current/10 px-4 py-6 text-center text-xs opacity-60">
        Agendamentos organizados com AgendaFlow.
      </footer>
    </main>
  );
}
