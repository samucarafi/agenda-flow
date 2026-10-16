import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function LegacyAgendaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (user.role !== "owner") {
    redirect("/cliente");
  }

  // A agenda agora pertence a um negócio específico.
  redirect("/dashboard/negocios");
}
