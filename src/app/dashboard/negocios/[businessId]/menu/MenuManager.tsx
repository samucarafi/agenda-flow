"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import {
  createRestaurantMenuCategory,
  createRestaurantMenuItem,
  setRestaurantMenuItemAvailability,
  updateRestaurantMenuItemImage,
} from "@/actions/restaurant-menu";

type Category = { id: string; name: string; description: string };
type Item = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number | null;
  available: boolean;
};

export default function MenuManager({
  businessId,
  initialCategories,
  initialItems,
}: {
  businessId: string;
  initialCategories: Category[];
  initialItems: Item[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<{ success: boolean; error?: string }>,
  ) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("businessId", businessId);
    try {
      const result = await action(data);
      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }
      form.reset();
      setMessage("Alterações salvas.");
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function toggleAvailability(item: Item) {
    setPending(true);
    setError("");
    const data = new FormData();
    data.set("businessId", businessId);
    data.set("itemId", item.id);
    data.set("available", String(!item.available));
    try {
      const result = await setRestaurantMenuItemAvailability(data);
      if (!result.success) {
        setError(result.error ?? "Não foi possível atualizar o item.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function updatePhoto(item: Item, file?: File) {
    if (!file) return;
    setPending(true);
    setError("");
    setMessage("");
    const data = new FormData();
    data.set("businessId", businessId);
    data.set("itemId", item.id);
    data.set("image", file);
    try {
      const result = await updateRestaurantMenuItemImage(data);
      if (!result.success) {
        setError(result.error ?? "Não foi possível atualizar a foto.");
      } else {
        setMessage(`Foto de ${item.name} atualizada.`);
        router.refresh();
      }
    } catch {
      setError("O envio da foto falhou. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  const money = (value: number | null) => value === null
    ? "Preço sob consulta"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const visibleCategories = useMemo(
    () => initialCategories.filter((category) => selectedCategory === "all" || category.id === selectedCategory),
    [initialCategories, selectedCategory],
  );
  const itemCountByCategory = useMemo(
    () => new Map(initialCategories.map((category) => [
      category.id,
      initialItems.filter((item) => item.categoryId === category.id).length,
    ])),
    [initialCategories, initialItems],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={(event) => void submit(event, createRestaurantMenuCategory)}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-950">Nova categoria</h2>
          <p className="mt-1 text-sm text-slate-500">Ex.: Entradas, Pratos principais ou Bebidas.</p>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Nome da categoria
            <input name="name" required minLength={2} maxLength={80} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Descrição (opcional)
            <input name="description" maxLength={300} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          <button disabled={pending} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Adicionar categoria</button>
        </form>

        <form
          onSubmit={(event) => void submit(event, createRestaurantMenuItem)}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-950">Novo item</h2>
          <p className="mt-1 text-sm text-slate-500">Adicione um prato ou bebida a uma categoria.</p>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Categoria
            <select name="categoryId" required disabled={!initialCategories.length} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">
              <option value="">Selecione uma categoria</option>
              {initialCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="block text-sm font-medium text-slate-700">
              Nome do item
              <input name="name" required minLength={2} maxLength={100} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Preço (R$)
              <input name="price" type="number" min={0} max={999999} step="0.01" placeholder="Opcional" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
          </div>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Descrição (opcional)
            <textarea name="description" maxLength={600} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Foto do item (opcional)
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={pending}
              className="mt-1.5 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:font-semibold file:text-slate-700 hover:file:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG, WebP ou AVIF · até 5 MB</span>
          </label>
          <button disabled={pending || !initialCategories.length} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Adicionar ao menu</button>
          {!initialCategories.length && <p className="mt-2 text-xs text-amber-700">Crie uma categoria antes de adicionar itens.</p>}
        </form>
      </section>

      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Itens do menu</h2>
          <p className="mt-1 text-sm text-slate-500">Itens indisponíveis ficam ocultos da página pública.</p>
        </div>
        {initialCategories.length > 0 && (
          <div aria-label="Filtrar itens por categoria" className="flex gap-2 overflow-x-auto pb-1">
            <CategoryFilterButton
              active={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
              label="Todas"
              count={initialItems.length}
            />
            {initialCategories.map((category) => (
              <CategoryFilterButton
                key={category.id}
                active={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
                label={category.name}
                count={itemCountByCategory.get(category.id) ?? 0}
              />
            ))}
          </div>
        )}
        {!initialCategories.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Comece criando uma categoria para o cardápio.</div>
        ) : visibleCategories.map((category) => {
          const categoryItems = initialItems.filter((item) => item.categoryId === category.id);
          return (
            <section key={category.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-950">{category.name}</h3>
                {category.description && <p className="mt-1 text-sm text-slate-500">{category.description}</p>}
              </div>
              {categoryItems.length ? categoryItems.map((item) => (
                <article key={item.id} className="flex flex-col gap-4 border-b border-slate-100 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={88} height={88} className="size-20 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">Sem foto</div>
                    )}
                    <div className="min-w-0">
                    <h4 className="font-medium text-slate-900">{item.name}</h4>
                    {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
                    <p className="mt-2 text-sm font-semibold text-slate-800">{money(item.price)}</p>
                    </div>
                  </div>
                  <button type="button" disabled={pending} onClick={() => void toggleAvailability(item)} className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${item.available ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {item.available ? "Disponível · ocultar" : "Oculto · publicar"}
                  </button>
                  <label className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 ${pending ? "pointer-events-none opacity-50" : ""}`}>
                    {item.imageUrl ? "Trocar foto" : "Adicionar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={pending}
                      className="sr-only"
                      onChange={(event) => {
                        void updatePhoto(item, event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </article>
              )) : <p className="p-5 text-sm text-slate-500">Ainda não há itens nesta categoria.</p>}
            </section>
          );
        })}
      </section>
    </div>
  );
}

function CategoryFilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"}`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>{count}</span>
    </button>
  );
}
