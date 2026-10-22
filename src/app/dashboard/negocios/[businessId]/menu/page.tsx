import { notFound, redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import MenuManager from "./MenuManager";
import { PageHeading } from "@/components/dashboard/PageHeading";

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
        <PageHeading
          eyebrow="Operação do restaurante"
          title="Menu digital"
          description="Organize categorias e itens. Somente itens marcados como disponíveis aparecem aos clientes."
          actions={(
            <a
              href={`/b/${access.business.slug}#cardapio`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-auto"
            >
              Ver menu público ↗
            </a>
          )}
        />
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
            imageUrl: item.imageUrl ?? "",
            price: item.price ?? null,
            available: item.available,
          }))}
        />
      </div>
    </DashboardLayout>
  );
}
