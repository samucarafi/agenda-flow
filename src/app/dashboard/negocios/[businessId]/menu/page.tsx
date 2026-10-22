import { notFound, redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import MenuManager from "./MenuManager";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const access = await getOwnedBusiness(businessId);
  if (!access) notFound();
  if (access.business.category !== "restaurant") {
    redirect(`/dashboard/negocios/${businessId}/configuracoes`);
  }

  await connectToDatabase();
  const [categories, items] = await Promise.all([
    MenuCategory.find({ businessId, active: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    MenuItem.find({ businessId }).sort({ categoryId: 1, sortOrder: 1, name: 1 }).lean(),
  ]);

  return (
    <DashboardLayout
      title="Menu digital"
      description={access.business.name}
      businessCategory="restaurant"
      showHeader={false}
    >
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">OPERAÇÃO DO RESTAURANTE</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Menu digital</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Organize categorias e itens. Somente itens marcados como disponíveis aparecem aos clientes.
            </p>
          </div>
          <a
            href={`/b/${access.business.slug}#cardapio`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver menu público ↗
          </a>
        </header>
        <MenuManager
          businessId={businessId}
          initialCategories={categories.map((category) => ({
            id: category._id.toString(),
            name: category.name,
            description: category.description ?? "",
          }))}
          initialItems={items.map((item) => ({
            id: item._id.toString(),
            categoryId: item.categoryId.toString(),
            name: item.name,
            description: item.description ?? "",
            price: item.price ?? null,
            available: item.available,
          }))}
        />
      </div>
    </DashboardLayout>
  );
}
