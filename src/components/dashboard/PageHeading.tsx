import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 sm:text-sm">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
      {actions && <div className="w-full shrink-0 sm:w-auto">{actions}</div>}
    </header>
  );
}
