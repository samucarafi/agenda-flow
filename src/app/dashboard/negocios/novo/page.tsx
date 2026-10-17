import Link from "next/link";
import { FiBriefcase } from "react-icons/fi";

import { CreateBusinessForm } from "@/components/dashboard/businesses/CreateBusinessForm";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function NewBusinessPage() {
  return (
    <DashboardLayout
      title="Novo negócio"
      description="Cadastre seu estabelecimento."
      showHeader={false}
    >
      <main className="min-h-full bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard/negocios"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Meus negócios
          </Link>

          <header className="mb-8 mt-6">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
              <FiBriefcase size={24} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Criar um negócio
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Configure seu estabelecimento. Depois você poderá personalizar a
              aparência, cadastrar serviços e ativar os agendamentos.
            </p>
          </header>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
            <CreateBusinessForm />
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}
