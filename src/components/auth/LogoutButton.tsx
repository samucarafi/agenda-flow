"use client";

import { useTransition } from "react";
import { FiLogOut } from "react-icons/fi";

import { logout } from "@/actions/auth";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FiLogOut size={17} className={pending ? "animate-pulse" : ""} />

      <span>{pending ? "Saindo..." : "Sair da conta"}</span>
    </button>
  );
}
