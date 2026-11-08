import { redirect } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");

  if (user.role !== "owner") {
    redirect("/perfil");
  }

  if (user.mustChangePassword) {
    redirect("/alterar-senha");
  }

  return (
    <DashboardLayout
      title="Meu perfil"
      description="Gerencie suas informações pessoais e segurança."
    >
      <div className="max-w-4xl">
        <ProfileSettings
          initialName={user.name}
          initialEmail={user.email}
          role={user.role}
        />
      </div>
    </DashboardLayout>
  );
}
