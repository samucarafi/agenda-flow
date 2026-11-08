import type { ReactNode } from "react";
import { ClientNavigation } from "@/components/navigation/ClientNavigation";
import { PushNotificationSettings } from "@/components/mobile/PushNotificationSettings";
import { NotificationInbox } from "@/components/mobile/NotificationInbox";
import { getCurrentUser } from "@/lib/auth";

export async function ClientAreaLayout({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "wide" | "standard";
}) {
  const user = await getCurrentUser();
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className={`mx-auto ${width === "wide" ? "max-w-6xl" : "max-w-4xl"}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <ClientNavigation isOwner={user?.role === "owner"} />
          <div className="flex items-center gap-2">
            <NotificationInbox />
            <PushNotificationSettings />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
