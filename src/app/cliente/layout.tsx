import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.mustChangePassword) redirect("/alterar-senha");
  if (user.role !== "client" && user.role !== "owner") redirect("/dashboard");
  return children;
}
