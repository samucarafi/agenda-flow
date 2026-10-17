"use server";

import mongoose from "mongoose";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import RestaurantTable from "@/models/RestaurantTable";

const createTableSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  name: z.string().trim().min(1).max(40),
  capacity: z.coerce.number().int().min(1).max(40),
});

export async function createRestaurantTable(formData: FormData) {
  const parsed = createTableSchema.safeParse({
    businessId: formData.get("businessId"),
    name: formData.get("name"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const access = await getOwnedBusiness(parsed.data.businessId);
  if (!access || access.business.category !== "restaurant") {
    return { success: false, error: "Restaurante não encontrado ou acesso não autorizado." };
  }

  await connectToDatabase();
  try {
    const table = await RestaurantTable.create({
      businessId: parsed.data.businessId,
      name: parsed.data.name,
      capacity: parsed.data.capacity,
      status: "available",
      active: true,
    });
    revalidatePath(`/dashboard/negocios/${parsed.data.businessId}/mesas`);
    return { success: true, tableId: table._id.toString() };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return { success: false, error: "Já existe uma mesa com esse nome." };
    }
    console.error("createRestaurantTable:", error);
    return { success: false, error: "Não foi possível criar a mesa." };
  }
}
