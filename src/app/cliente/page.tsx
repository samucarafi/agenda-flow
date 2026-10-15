import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ClientPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (user.role !== "client") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-cyan-400">
          AGENDaflow · ÁREA DO CLIENTE
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Olá, {user.name}!
        </h1>

        <p className="mt-2 text-slate-400">
          Aqui você poderá agendar serviços e acompanhar seus horários.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Meus agendamentos</h2>

          <p className="mt-2 text-sm text-slate-400">
            Estamos preparando sua agenda para você consultar e gerenciar seus
            próprios agendamentos.
          </p>
        </section>
      </div>
    </main>
  );
}
