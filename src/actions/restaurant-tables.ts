"use server";

import mongoose from "mongoose";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import RestaurantTable, {
  RESTAURANT_TABLE_STATUSES,
} from "@/models/RestaurantTable";

const tableSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  name: z.string().trim().min(1, "Informe o nome da mesa.").max(40),
  capacity: z.coerce.number().int().min(1).max(40),
});

const statusSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  tableId: z.string().refine(mongoose.isValidObjectId, "Mesa inválida."),
  status: z.enum(RESTAURANT_TABLE_STATUSES),
});

const deactivateSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  tableId: z.string().refine(mongoose.isValidObjectId, "Mesa inválida."),
});

async function authorizeRestaurant(businessId: string) {
  const access = await getOwnedBusiness(businessId);

  if (!access || access.business.category !== "restaurant") {
    return false;
  }

  return true;
}

function refreshTables(businessId: string) {
  revalidatePath(`/dashboard/negocios/${businessId}/mesas`);
  revalidatePath(`/dashboard/negocios/${businessId}/fila-de-espera`);
  revalidatePath(`/dashboard/negocios/${businessId}/reservas`);
}

export async function createRestaurantTable(formData: FormData) {
  const parsed = tableSchema.safeParse({
    businessId: formData.get("businessId"),
    name: formData.get("name"),
    capacity: formData.get("capacity"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { businessId, name, capacity } = parsed.data;

  if (!(await authorizeRestaurant(businessId))) {
    return { success: false, error: "Acesso não autorizado." };
  }

  await connectToDatabase();

  try {
    const table = await RestaurantTable.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      name,
      capacity,
      status: "available",
      active: true,
    });

    refreshTables(businessId);

    return { success: true, tableId: table._id.toString() };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return { success: false, error: "Já existe uma mesa com esse nome." };
    }

    console.error("createRestaurantTable:", error);
    return { success: false, error: "Não foi possível cadastrar a mesa." };
  }
}

export async function updateRestaurantTableStatus(formData: FormData) {
  const parsed = statusSchema.safeParse({
    businessId: formData.get("businessId"),
    tableId: formData.get("tableId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { businessId, tableId, status } = parsed.data;

  if (status === "occupied") {
    return {
      success: false,
      error: "Mesas só podem ser ocupadas ao acomodar um grupo da fila.",
    };
  }

  if (!(await authorizeRestaurant(businessId))) {
    return { success: false, error: "Acesso não autorizado." };
  }

  await connectToDatabase();

  try {
    const table = await RestaurantTable.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(tableId),
        businessId: new mongoose.Types.ObjectId(businessId),
        active: true,
        status: { $ne: "occupied" },
      },
      { $set: { status } },
      { new: true, runValidators: true },
    );

    if (!table) {
      return { success: false, error: "Mesa ocupada, indisponível ou inativa." };
    }

    refreshTables(businessId);
    return { success: true };
  } catch (error) {
    console.error("updateRestaurantTableStatus:", error);
    return { success: false, error: "Não foi possível alterar a mesa." };
  }
}

export async function deactivateRestaurantTable(formData: FormData) {
  const parsed = deactivateSchema.safeParse({
    businessId: formData.get("businessId"),
    tableId: formData.get("tableId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const { businessId, tableId } = parsed.data;

  if (!(await authorizeRestaurant(businessId))) {
    return { success: false, error: "Acesso não autorizado." };
  }

  await connectToDatabase();

  try {
    const table = await RestaurantTable.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(tableId),
        businessId: new mongoose.Types.ObjectId(businessId),
        active: true,
        status: { $ne: "occupied" },
      },
      { $set: { active: false } },
      { new: true },
    );

    if (!table) {
      return {
        success: false,
        error: "Mesa não encontrada ou ocupada. Libere-a antes de desativar.",
      };
    }

    refreshTables(businessId);
    return { success: true };
  } catch (error) {
    console.error("deactivateRestaurantTable:", error);
    return { success: false, error: "Não foi possível desativar a mesa." };
  }
}

const reactivateSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  tableId: z.string().refine(mongoose.isValidObjectId, "Mesa inválida."),
});

export async function reactivateRestaurantTable(formData: FormData) {
  const parsed = reactivateSchema.safeParse({
    businessId: formData.get("businessId"),
    tableId: formData.get("tableId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const { businessId, tableId } = parsed.data;

  if (!(await authorizeRestaurant(businessId))) {
    return { success: false, error: "Acesso não autorizado." };
  }

  await connectToDatabase();

  try {
    const table = await RestaurantTable.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(tableId),
        businessId: new mongoose.Types.ObjectId(businessId),
        active: false,
      },
      {
        $set: {
          active: true,
          status: "available",
        },
      },
      { new: true, runValidators: true },
    );

    if (!table) {
      return {
        success: false,
        error: "Mesa desativada não encontrada.",
      };
    }

    refreshTables(businessId);
    return { success: true };
  } catch (error) {
    console.error("reactivateRestaurantTable:", error);
    return {
      success: false,
      error: "Não foi possível reativar a mesa.",
    };
  }
}
