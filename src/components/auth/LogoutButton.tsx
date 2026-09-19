"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";

import { logout } from "@/actions/auth";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();

      router.replace("/entrar");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      aria-label="Sair"
      title="Sair"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FiLogOut size={14} />
    </button>
  );
}
