"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiArrowUpRight, FiMapPin, FiSearch } from "react-icons/fi";

type Business = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  zipCode: string;
};

const categories = [
  { value: "all", label: "Todos" },
  { value: "barbershop", label: "Barbearias" },
  { value: "beauty_salon", label: "Salões" },
  { value: "restaurant", label: "Restaurantes" },
  { value: "other", label: "Outros" },
];

const labels: Record<string, string> = {
  barbershop: "Barbearia",
  beauty_salon: "Salão de beleza",
  restaurant: "Restaurante",
  other: "Estabelecimento",
};

function digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatCep(value: string) {
  const valueDigits = digits(value);
  return valueDigits.length > 5
    ? `${valueDigits.slice(0, 5)}-${valueDigits.slice(5)}`
    : valueDigits;
}

function sharedPrefix(first: string, second: string) {
  let length = 0;
  while (length < Math.min(first.length, second.length) && first[length] === second[length]) length += 1;
  return length;
}

export function BusinessDirectory({ businesses }: { businesses: Business[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cep, setCep] = useState("");
  const [order, setOrder] = useState<"relevance" | "proximity">("relevance");
  const referenceCep = digits(cep);

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const results = businesses.filter((business) => {
      const matchesCategory = category === "all" || business.category === category;
      const searchText = `${business.name} ${business.description} ${labels[business.category] ?? ""}`.toLocaleLowerCase("pt-BR");
      return matchesCategory && (!normalizedQuery || searchText.includes(normalizedQuery));
    });

    if (order === "proximity" && referenceCep.length >= 3) {
      results.sort((first, second) => {
        const firstCep = digits(first.zipCode);
        const secondCep = digits(second.zipCode);
        const prefixDifference = sharedPrefix(secondCep, referenceCep) - sharedPrefix(firstCep, referenceCep);
        if (prefixDifference) return prefixDifference;
        const firstRegion = Number(firstCep.slice(0, 5));
        const secondRegion = Number(secondCep.slice(0, 5));
        const referenceRegion = Number(referenceCep.slice(0, 5));
        return Math.abs(firstRegion - referenceRegion) - Math.abs(secondRegion - referenceRegion);
      });
    } else {
      results.sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
    }
    return results;
  }, [businesses, category, order, query, referenceCep]);

  return (
    <div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
        <label className="relative block">
          <span className="sr-only">Buscar por estabelecimento</span>
          <FiSearch aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou descrição"
            className="w-full rounded-xl border border-white/15 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">CEP de referência</span>
          <FiMapPin aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            inputMode="numeric"
            autoComplete="postal-code"
            value={cep}
            onChange={(event) => setCep(formatCep(event.target.value))}
            placeholder="Seu CEP"
            aria-describedby="cep-help"
            className="w-full rounded-xl border border-white/15 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
          />
        </label>
        <label className="block">
          <span className="sr-only">Ordenar estabelecimentos</span>
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as "relevance" | "proximity")}
            disabled={referenceCep.length < 3}
            className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-sm text-white disabled:opacity-50"
          >
            <option value="relevance">Ordem alfabética</option>
            <option value="proximity">Mais próximos do CEP</option>
          </select>
        </label>
      </div>
      <p id="cep-help" className="mt-2 text-xs text-slate-400">
        A proximidade é estimada pela região do CEP; não representa distância exata em quilômetros.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar por tipo de negócio">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            onClick={() => setCategory(item.value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${category === item.value ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/15 text-slate-200 hover:bg-white/[0.06]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-sm text-slate-400" aria-live="polite">
        {filteredBusinesses.length} {filteredBusinesses.length === 1 ? "estabelecimento encontrado" : "estabelecimentos encontrados"}
      </p>
      {filteredBusinesses.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <p className="font-medium text-white">Nenhum estabelecimento encontrado</p>
          <p className="mt-2 text-sm text-slate-400">Tente mudar a busca, o tipo de negócio ou o CEP.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((business) => {
            const businessCep = digits(business.zipCode);
            const localMatch = referenceCep.length >= 3 && businessCep.startsWith(referenceCep.slice(0, Math.min(referenceCep.length, 5)));
            return (
              <article key={business.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-300/40">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><FiMapPin size={21} /></span>
                  {localMatch && <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200">Região do seu CEP</span>}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{business.name}</h3>
                <p className="mt-1 text-sm text-slate-300">{labels[business.category] ?? "Estabelecimento"}</p>
                {business.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{business.description}</p>}
                <Link href={`/b/${business.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                  Conhecer estabelecimento <FiArrowUpRight size={17} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
