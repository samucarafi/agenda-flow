import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CriarContaPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "owner" ? "/dashboard" : "/cliente");
  }

  return <RegisterForm />;
}
