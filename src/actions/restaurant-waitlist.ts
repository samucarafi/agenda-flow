"use server";

import mongoose from "mongoose";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import WaitlistEntry, {
  WAITLIST_STATUSES,
  type WaitlistStatus,
} from "@/models/WaitlistEntry";

const addWaitlistSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  notes: z.string().trim().max(300).default(""),
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).default(""),
  partySize: z.coerce.number().int().min(1).max(40),
});

const updateStatusSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  entryId: z.string().refine(mongoose.isValidObjectId, "Entrada inválida."),
  status: z.enum(WAITLIST_STATUSES),
});

const ACTIVE_STATUSES: WaitlistStatus[] = ["waiting", "called"];

async function reindexActiveEntries(businessId: mongoose.Types.ObjectId) {
  const entries = await WaitlistEntry.find({
    businessId,
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ joinedAt: 1, _id: 1 })
    .select("_id position")
    .lean();

  // Atualização sequencial para evitar disparar várias gravações em paralelo.
  for (const [index, entry] of entries.entries()) {
    const position = index + 1;

    if (entry.position !== position) {
      await WaitlistEntry.updateOne(
        { _id: entry._id, businessId },
        { $set: { position } },
      );
    }
  }
}

function refreshWaitlistPaths(businessId: string) {
  revalidatePath(`/dashboard/negocios/${businessId}/fila-de-espera`);
  revalidatePath(`/dashboard/negocios/${businessId}/mesas`);
}

export async function addRestaurantWaitlistEntry(formData: FormData) {
  const parsed = addWaitlistSchema.safeParse({
    businessId: formData.get("businessId"),
    customerName: formData.get("customerName"),
    notes: formData.get("notes") ?? "",
    phone: formData.get("phone") ?? "",
    partySize: formData.get("partySize"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const access = await getOwnedBusiness(parsed.data.businessId);

  if (!access || access.business.category !== "restaurant") {
    return {
      success: false,
      error: "Restaurante não encontrado ou acesso não autorizado.",
    };
  }

  await connectToDatabase();

  const businessId = new mongoose.Types.ObjectId(parsed.data.businessId);

  try {
    const entry = await WaitlistEntry.create({
      businessId,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
      partySize: parsed.data.partySize,
      position: 1,
      status: "waiting",
      joinedAt: new Date(),
    });

    await reindexActiveEntries(businessId);
    refreshWaitlistPaths(parsed.data.businessId);

    const savedEntry = await WaitlistEntry.findById(entry._id)
      .select("position")
      .lean();

    return {
      success: true,
      entryId: entry._id.toString(),
      position: savedEntry?.position ?? 1,
    };
  } catch (error) {
    console.error("addRestaurantWaitlistEntry:", error);

    return {
      success: false,
      error: "Não foi possível adicionar o grupo à fila.",
    };
  }
}

export async function updateRestaurantWaitlistStatus(formData: FormData) {
  const parsed = updateStatusSchema.safeParse({
    businessId: formData.get("businessId"),
    entryId: formData.get("entryId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { businessId: businessIdString, entryId, status } = parsed.data;

  const access = await getOwnedBusiness(businessIdString);

  if (!access || access.business.category !== "restaurant") {
    return {
      success: false,
      error: "Restaurante não encontrado ou acesso não autorizado.",
    };
  }

  await connectToDatabase();

  const businessId = new mongoose.Types.ObjectId(businessIdString);
  const entryObjectId = new mongoose.Types.ObjectId(entryId);

  try {
    const entry = await WaitlistEntry.findOne({
      _id: entryObjectId,
      businessId,
    });

    if (!entry) {
      return { success: false, error: "Grupo não encontrado." };
    }

    const allowedTransitions: Record<WaitlistStatus, WaitlistStatus[]> = {
      waiting: ["called", "seated", "cancelled", "no_show"],
      called: ["waiting", "seated", "cancelled", "no_show"],
      seated: [],
      cancelled: [],
      no_show: [],
    };

    if (entry.status !== status) {
      if (!allowedTransitions[entry.status].includes(status)) {
        return {
          success: false,
          error: "Essa alteração de status não é permitida.",
        };
      }

      entry.status = status;

      if (status === "called") {
        entry.calledAt = new Date();
      }

      if (status === "seated") {
        entry.seatedAt = new Date();
      }

      await entry.save();
    }

    await reindexActiveEntries(businessId);
    refreshWaitlistPaths(businessIdString);

    return { success: true };
  } catch (error) {
    console.error("updateRestaurantWaitlistStatus:", error);

    return {
      success: false,
      error: "Não foi possível atualizar o grupo.",
    };
  }
}
