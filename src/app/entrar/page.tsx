import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  const safeNext =
    next && /^\/b\/[a-z0-9-]+\/agendar(?:\?service=[a-f\d]{24})?$/i.test(next)
      ? next
      : undefined;

  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "owner" ? "/dashboard" : (safeNext ?? "/cliente"));
  }

  return <LoginForm nextPath={safeNext} />;
}
