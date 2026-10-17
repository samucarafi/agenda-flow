"use server";

import mongoose from "mongoose";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import WaitlistEntry from "@/models/WaitlistEntry";

const addWaitlistSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).default(""),
  partySize: z.coerce.number().int().min(1).max(40),
});

export async function addRestaurantWaitlistEntry(formData: FormData) {
  const parsed = addWaitlistSchema.safeParse({
    businessId: formData.get("businessId"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone") ?? "",
    partySize: formData.get("partySize"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const access = await getOwnedBusiness(parsed.data.businessId);
  if (!access || access.business.category !== "restaurant") {
    return { success: false, error: "Restaurante não encontrado ou acesso não autorizado." };
  }

  await connectToDatabase();
  const businessId = new mongoose.Types.ObjectId(parsed.data.businessId);

  try {
    // O contador é derivado no servidor; a posição não é aceita do cliente.
    const activeCount = await WaitlistEntry.countDocuments({
      businessId,
      status: { $in: ["waiting", "called"] },
    });
    const entry = await WaitlistEntry.create({
      businessId,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      partySize: parsed.data.partySize,
      position: activeCount + 1,
      status: "waiting",
      joinedAt: new Date(),
    });
    revalidatePath(`/dashboard/negocios/${parsed.data.businessId}/fila-de-espera`);
    return { success: true, entryId: entry._id.toString(), position: entry.position };
  } catch (error) {
    console.error("addRestaurantWaitlistEntry:", error);
    return { success: false, error: "Não foi possível adicionar o grupo à fila." };
  }
}
