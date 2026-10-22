import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ClientAreaLayout } from "@/components/client/ClientAreaLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.mustChangePassword) redirect("/alterar-senha");

  const settings = (
    <>
      <header className="mb-7">
        <p className="text-sm font-semibold text-cyan-300">SUA CONTA</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Meu perfil</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Gerencie suas informações pessoais e mantenha sua senha atualizada.</p>
      </header>
      <ProfileSettings initialName={user.name} initialEmail={user.email} role={user.role} />
    </>
  );

  if (user.role === "owner") {
    return (
      <DashboardLayout title="Meu perfil" description="Informações pessoais e segurança">
        {settings}
      </DashboardLayout>
    );
  }

  return (
    <ClientAreaLayout width="standard">
      {settings}
      <div className="mt-6 max-w-4xl"><LogoutButton /></div>
    </ClientAreaLayout>
  );
}
