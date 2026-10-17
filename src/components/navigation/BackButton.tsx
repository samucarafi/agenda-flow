import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

interface BackButtonProps {
  fallbackHref: string;
  label?: string;
}

export function BackButton({
  fallbackHref,
  label = "Voltar",
}: BackButtonProps) {
  return (
    <Link
      href={fallbackHref}
      className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff] focus-visible:ring-offset-2"
    >
      <FiArrowLeft size={15} aria-hidden="true" />
      {label}
    </Link>
  );
}
