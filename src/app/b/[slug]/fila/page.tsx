import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import JoinWaitlistForm from "./JoinWaitListForm";
import WaitlistEntry from "@/models/WaitlistEntry";
import RestaurantWaitlistStatus from "./RestaurantWaitlistStatus";
import { PublicBusinessNavigation } from "@/components/navigation/PublicBusinessNavigation";
import { getBusinessTheme } from "@/lib/business-theme";
import RestaurantTable from "@/models/RestaurantTable";
import { reconcileSeatedEntry } from "@/lib/reconcile-seated-entry";
import { isBusinessWithinHours } from "@/lib/business-hours";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicRestaurantWaitlistPage({
  params,
}: PageProps) {
  const { slug } = await params;

  await connectToDatabase();

  const business = await Business.findOne({
    slug: slug.toLowerCase(),
    category: "restaurant",
    status: "active",
  })
    .select("_id name slug theme timezone availability")
    .lean();

  if (!business) notFound();

  const user = await getCurrentUser();

  let latestEntry =
    user?.role === "client"
      ? await WaitlistEntry.findOne({
          businessId: business._id,
          userId: user.id,
        })
          .sort({ joinedAt: -1, _id: -1 })
          .select("_id position partySize status joinedAt completedAt tableId")
          .lean()
      : null;

  if (latestEntry?.status === "seated") {
    const reconciledStatus = await reconcileSeatedEntry(latestEntry);
    latestEntry = { ...latestEntry, status: reconciledStatus };
  }

  const occupiedTable =
    latestEntry?.status === "seated" && latestEntry.tableId
      ? await RestaurantTable.findOne({
          _id: latestEntry.tableId,
          businessId: business._id,
          status: "occupied",
          $or: [
            { occupiedEntryId: latestEntry._id },
            { occupiedEntryId: { $exists: false } },
            { occupiedEntryId: null },
          ],
        }).select("name").lean()
      : null;

  type PublicEntryStatus = "waiting" | "called" | "seated";

  const visibleEntry =
    latestEntry &&
    (latestEntry.status === "waiting" ||
      latestEntry.status === "called" ||
      latestEntry.status === "seated")
      ? {
          ...latestEntry,
          status: latestEntry.status as PublicEntryStatus,
        }
      : null;
  const activeEntries = visibleEntry
    ? await WaitlistEntry.find({
        businessId: business._id,
        status: { $in: ["waiting", "called"] },
      })
        .sort({ joinedAt: 1, _id: 1 })
        .select("_id")
        .lean()
    : [];
  const visiblePosition = visibleEntry
    ? activeEntries.findIndex((entry) => entry._id.toString() === visibleEntry._id.toString()) + 1
    : 0;
  const theme = getBusinessTheme(business.theme);
  const queueOpen = isBusinessWithinHours(business.availability, business.timezone);
  const weekdayNames = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const workingDaysLabel = business.availability.workingDays
    .map((day) => weekdayNames[day])
    .filter(Boolean)
    .join(", ");
  const completedEntry = latestEntry?.status === "completed" ? latestEntry : null;
  return (
    <main
      className="business-public-page min-h-screen px-4 py-8 sm:px-6 sm:py-12"
      data-template={theme.template}
      style={{
        background: theme.template === "minimal"
          ? theme.primaryColor
          : theme.template === "bold"
            ? `linear-gradient(135deg, ${theme.primaryColor}, color-mix(in srgb, ${theme.primaryColor} 78%, ${theme.accentColor}))`
            : `linear-gradient(145deg, ${theme.primaryColor}, color-mix(in srgb, ${theme.primaryColor} 94%, ${theme.accentColor}))`,
        color: theme.primaryText,
        "--business-primary": theme.primaryColor,
        "--business-accent": theme.accentColor,
        "--business-accent-text": theme.accentText,
        "--business-surface": `color-mix(in srgb, ${theme.primaryColor} 94%, ${theme.primaryText})`,
        "--business-text": theme.primaryText,
        "--business-control-surface": `color-mix(in srgb, ${theme.primaryColor} 88%, ${theme.primaryText})`,
        "--business-border": theme.template === "bold"
          ? `color-mix(in srgb, ${theme.accentColor} 42%, transparent)`
          : `color-mix(in srgb, ${theme.primaryText} ${theme.template === "minimal" ? 12 : 16}%, transparent)`,
        "--business-radius": theme.template === "minimal" ? "1rem" : theme.template === "bold" ? "1.5rem" : "1.125rem",
      } as React.CSSProperties}
    >
      <div className="mx-auto max-w-xl">
        <PublicBusinessNavigation
          slug={business.slug}
          category="restaurant"
          bookingEnabled={false}
          current="queue"
          accentColor={theme.accentColor}
          accentText={theme.accentText}
          foregroundColor={theme.primaryText}
        />

        <header className="mb-8 mt-8" data-business-hero>
          <p className="text-sm font-semibold" style={{ color: theme.accentLabelColor }}>
            AGENDAFLOW · FILA DE ESPERA
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {business.name}
          </h1>
          <p className="mt-3 opacity-75">
            Entre na fila online e acompanhe sua posição pela sua conta.
          </p>
        </header>

        {user?.role === "client" && visibleEntry ? (
          <RestaurantWaitlistStatus
            businessId={business._id.toString()}
            businessName={business.name}
            initialEntry={{
              id: visibleEntry._id.toString(),
              position: visibleEntry.status === "seated" ? visibleEntry.position : visiblePosition,
              partySize: visibleEntry.partySize,
              status: visibleEntry.status,
              joinedAt: visibleEntry.joinedAt.toISOString(),
              tableName: occupiedTable?.name ?? null,
            }}
            theme={theme}
          />
        ) : user?.role === "client" ? (
          <>
            {completedEntry && (
              <section
                role="status"
                className="mb-4 rounded-2xl border border-current/15 p-5 shadow-sm"
                style={{ backgroundColor: "color-mix(in srgb, var(--business-primary) 86%, white)" }}
              >
                <p className="text-sm font-semibold" style={{ color: theme.accentLabelColor }}>
                  Atendimento concluído
                </p>
                <p className="mt-2 text-sm leading-6 opacity-80">
                  Sua visita a {business.name} foi encerrada. Se quiser, você já pode entrar novamente na fila.
                </p>
              </section>
            )}
            <JoinWaitlistForm
              businessId={business._id.toString()}
              businessName={business.name}
              accentColor={theme.accentColor}
              accentText={theme.accentText}
              isQueueOpen={queueOpen}
              openingTime={business.availability.openingTime}
              closingTime={business.availability.closingTime}
              workingDaysLabel={workingDaysLabel}
            />
          </>
        ) : (
          <section className="rounded-3xl border border-current/15 bg-current/5 p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold">
              Entre na sua conta
            </h2>
            <p className="mt-2 text-sm leading-6 opacity-75">
              Para entrar na fila e acompanhar sua posição, você precisa estar
              conectado a uma conta de cliente.
            </p>
            <Link
              href="/entrar"
              className="mt-5 inline-flex rounded-xl px-5 py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: theme.accentColor, color: theme.accentText }}
            >
              Entrar no AgendaFlow
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
