import { redirect } from "next/navigation";
import { ChangeTemporaryPasswordForm } from "@/components/auth/ChangeTemporaryPasswordForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (!user.mustChangePassword) redirect(user.role === "owner" ? "/dashboard" : "/cliente");
  return <ChangeTemporaryPasswordForm />;
}
