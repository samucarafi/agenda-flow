import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiArrowLeft, FiSettings, FiImage } from "react-icons/fi";
import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";

export default async function ManageBusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (user.role !== "owner") {
    redirect("/cliente");
  }

  const { businessId } = await params;

  if (!mongoose.isValidObjectId(businessId)) {
    notFound();
  }

  await connectToDatabase();

  const business = await Business.findOne({
    _id: businessId,
    ownerId: user.id,
  })
    .select(
      "name slug category status description timezone theme bookingSettings",
    )
    .lean();

  if (!business) {
    notFound();
  }

  const categories: Record<string, string> = {
    barbershop: "Barbearia",
    beauty_salon: "Salão de beleza",
    restaurant: "Restaurante",
    other: "Outro negócio",
  };

  return (
    <main className="min-h-full bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/negocios"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <FiArrowLeft />
          Meus negócios
        </Link>

        <header className="mt-6">
          <p className="text-sm text-cyan-400">
            {categories[business.category] ?? "Negócio"}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {business.name}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Gerencie a identidade e as configurações deste estabelecimento.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <FiImage className="text-cyan-400" size={24} />

            <h2 className="mt-4 font-semibold">Identidade visual</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Personalize o tema, as cores e a apresentação da página pública.
            </p>

            <p className="mt-4 text-xs text-slate-500">
              Template atual: {business.theme?.template ?? "default"}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <FiSettings className="text-cyan-400" size={24} />

            <h2 className="mt-4 font-semibold">Configurações</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Prepare os horários, as regras de reserva e a publicação do
              negócio.
            </p>

            <p className="mt-4 text-xs text-slate-500">
              Status: {business.status}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Reservas públicas:{" "}
              {business.bookingSettings?.enabled ? "Ativadas" : "Desativadas"}
            </p>
          </article>
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-semibold">Página pública</h2>

          <p className="mt-2 break-all text-sm text-slate-400">
            /b/{business.slug}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            A página só poderá receber reservas quando estiver ativa e as regras
            de disponibilidade estiverem configuradas.
          </p>
        </section>
      </div>
    </main>
  );
}
