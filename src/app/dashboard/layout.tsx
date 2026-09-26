import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  return (
    <AuthProvider
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
      }}
    >
      {children}
    </AuthProvider>
  );
}
