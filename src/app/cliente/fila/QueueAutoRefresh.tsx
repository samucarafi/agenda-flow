"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QueueAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <p className="text-xs text-slate-500">
      Atualização automática a cada 10 segundos.
    </p>
  );
}
