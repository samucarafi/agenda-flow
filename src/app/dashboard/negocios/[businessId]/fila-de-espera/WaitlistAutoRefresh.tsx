"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WaitlistAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <p className="text-xs text-slate-500">
      Atualização automática a cada 5 segundos.
    </p>
  );
}
