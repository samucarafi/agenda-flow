import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function Page() {
  return (
    <DashboardLayout
      title="Configurações"
      description="Personalize o funcionamento do seu negócio."
    >
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Configurações</h2>

        <p className="mt-2 text-sm text-zinc-500">
          Esta área será construída nas próximas etapas.
        </p>
      </div>
    </DashboardLayout>
  );
}
