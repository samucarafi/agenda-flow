import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import JoinWaitlistForm from "./JoinWaitListForm";
import WaitlistEntry from "@/models/WaitlistEntry";
import RestaurantWaitlistStatus from "./RestaurantWaitlistStatus";

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
    .select("_id name slug")
    .lean();

  if (!business) notFound();

  const user = await getCurrentUser();

  const activeEntry =
    user?.role === "client"
      ? await WaitlistEntry.findOne({
          businessId: business._id,
          userId: user.id,
          status: { $in: ["waiting", "called"] },
        })
          .select("_id position partySize status joinedAt")
          .lean()
      : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/b/${business.slug}`}
          className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          ← Voltar ao restaurante
        </Link>

        <header className="mb-8 mt-8">
          <p className="text-sm font-semibold text-indigo-600">
            AGENDAFLOW · FILA DE ESPERA
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {business.name}
          </h1>
          <p className="mt-3 text-slate-600">
            Entre na fila online e acompanhe sua posição pela sua conta.
          </p>
        </header>

        {user?.role === "client" && activeEntry ? (
          <RestaurantWaitlistStatus
            businessId={business._id.toString()}
            businessName={business.name}
            initialEntry={{
              id: activeEntry._id.toString(),
              position: activeEntry.position,
              partySize: activeEntry.partySize,
              status: activeEntry.status,
              joinedAt: activeEntry.joinedAt.toISOString(),
            }}
          />
        ) : user?.role === "client" ? (
          <JoinWaitlistForm
            businessId={business._id.toString()}
            businessName={business.name}
          />
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-950">
              Entre na sua conta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Para entrar na fila e acompanhar sua posição, você precisa estar
              conectado a uma conta de cliente.
            </p>
            <Link
              href="/entrar"
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Entrar no AgendaFlow
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
