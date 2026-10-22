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
import { getCurrentUser } from "@/lib/auth";
import Business from "@/models/Business";
import RestaurantTable from "@/models/RestaurantTable";
import { isAllowedWaitlistTransition } from "@/lib/waitlist-rules.mjs";

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

async function getActiveEntryPosition(
  businessId: mongoose.Types.ObjectId,
  entryId: mongoose.Types.ObjectId,
) {
  const entries = await WaitlistEntry.find({
    businessId,
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ joinedAt: 1, _id: 1 })
    .select("_id")
    .lean();
  const index = entries.findIndex((entry) => entry._id.equals(entryId));
  return index < 0 ? null : index + 1;
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

    refreshWaitlistPaths(parsed.data.businessId);

    return {
      success: true,
      entryId: entry._id.toString(),
      position: (await getActiveEntryPosition(businessId, entry._id)) ?? 1,
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

    if (status === "seated" || status === "completed") {
      return {
        success: false,
        error: "Esse status só pode ser atualizado pelo fluxo de mesas.",
      };
    }

    if (entry.status !== status) {
      if (!isAllowedWaitlistTransition(entry.status, status)) {
        return {
          success: false,
          error: "Essa alteração de status não é permitida.",
        };
      }

      const updated = await WaitlistEntry.findOneAndUpdate(
        { _id: entryObjectId, businessId, status: entry.status },
        {
          $set: {
            status,
            ...(status === "called" ? { calledAt: new Date() } : {}),
          },
          ...(status === "cancelled" || status === "no_show"
            ? { $unset: { activeUserKey: 1 } }
            : {}),
        },
        { new: true },
      );

      if (!updated) {
        return { success: false, error: "A entrada mudou em outra operação. Atualize a fila." };
      }
    }

    refreshWaitlistPaths(businessIdString);
    revalidatePath(`/b/${access.business.slug}/fila`);

    return { success: true };
  } catch (error) {
    console.error("updateRestaurantWaitlistStatus:", error);

    return {
      success: false,
      error: "Não foi possível atualizar o grupo.",
    };
  }
}

const joinAsClientSchema = z.object({
  businessId: z
    .string()
    .refine(mongoose.isValidObjectId, "Restaurante inválido."),
  partySize: z.coerce.number().int().min(1).max(40),
  notes: z.string().trim().max(300).default(""),
});

export async function joinRestaurantWaitlistAsClient(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "client") {
    return {
      success: false,
      error: "Entre na sua conta de cliente para participar da fila.",
    };
  }

  const parsed = joinAsClientSchema.safeParse({
    businessId: formData.get("businessId"),
    partySize: formData.get("partySize"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await connectToDatabase();

  const businessId = new mongoose.Types.ObjectId(parsed.data.businessId);
  const userId = new mongoose.Types.ObjectId(user.id);

  const business = await Business.findOne({
    _id: businessId,
    category: "restaurant",
    status: "active",
  })
    .select("_id name")
    .lean();

  if (!business) {
    return {
      success: false,
      error: "Restaurante não encontrado ou indisponível.",
    };
  }

  try {
    const existingEntry = await WaitlistEntry.findOne({
      businessId,
      userId,
      status: { $in: ["waiting", "called"] },
    })
      .select("_id")
      .lean();

    if (existingEntry) {
      return {
        success: false,
        error: "Você já tem uma entrada ativa na fila deste restaurante.",
      };
    }

    const entry = await WaitlistEntry.create({
      businessId,
      userId,
      activeUserKey: userId.toString(),
      customerName: user.name,
      partySize: parsed.data.partySize,
      notes: parsed.data.notes,
      position: 1,
      status: "waiting",
      joinedAt: new Date(),
    });

    revalidatePath("/cliente/fila");
    revalidatePath(
      `/dashboard/negocios/${parsed.data.businessId}/fila-de-espera`,
    );
    revalidatePath(`/b/${business.slug}/fila`);

    return {
      success: true,
      entryId: entry._id.toString(),
      position: (await getActiveEntryPosition(businessId, entry._id)) ?? 1,
      businessName: business.name,
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return {
        success: false,
        error: "Você já tem uma entrada ativa na fila deste restaurante.",
      };
    }

    console.error("joinRestaurantWaitlistAsClient:", error);

    return {
      success: false,
      error: "Não foi possível entrar na fila. Tente novamente.",
    };
  }
}

const seatGroupSchema = z.object({
  businessId: z
    .string()
    .refine(mongoose.isValidObjectId, "Restaurante inválido."),
  entryId: z.string().refine(mongoose.isValidObjectId, "Entrada inválida."),
  tableId: z.string().refine(mongoose.isValidObjectId, "Mesa inválida."),
});

export async function seatRestaurantWaitlistEntry(formData: FormData) {
  const parsed = seatGroupSchema.safeParse({
    businessId: formData.get("businessId"),
    entryId: formData.get("entryId"),
    tableId: formData.get("tableId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { businessId, entryId, tableId } = parsed.data;
  const access = await getOwnedBusiness(businessId);

  if (!access || access.business.category !== "restaurant") {
    return { success: false, error: "Acesso não autorizado." };
  }

  await connectToDatabase();

  const businessObjectId = new mongoose.Types.ObjectId(businessId);
  const entryObjectId = new mongoose.Types.ObjectId(entryId);
  const tableObjectId = new mongoose.Types.ObjectId(tableId);

  let claimedTableId: mongoose.Types.ObjectId | null = null;

  try {
    const entry = await WaitlistEntry.findOne({
      _id: entryObjectId,
      businessId: businessObjectId,
      status: { $in: ["waiting", "called"] },
      tableId: { $exists: false },
    }).select("_id partySize");

    if (!entry) {
      return {
        success: false,
        error: "Grupo não encontrado ou já acomodado.",
      };
    }

    // A atualização condicional impede reservar uma mesa que
    // já esteja ocupada ou tenha capacidade insuficiente.
    const table = await RestaurantTable.findOneAndUpdate(
      {
        _id: tableObjectId,
        businessId: businessObjectId,
        active: true,
        status: "available",
        capacity: { $gte: entry.partySize },
      },
      {
        $set: {
          status: "occupied",
          occupiedEntryId: entryObjectId,
          occupiedAt: new Date(),
        },
        $unset: { releasedAt: 1 },
      },
      { new: true },
    );

    if (!table) {
      return {
        success: false,
        error: "Mesa indisponível ou com capacidade insuficiente.",
      };
    }

    claimedTableId = table._id;

    // A condição protege contra uma alteração concorrente da fila.
    const updatedEntry = await WaitlistEntry.findOneAndUpdate(
      {
        _id: entryObjectId,
        businessId: businessObjectId,
        status: { $in: ["waiting", "called"] },
        tableId: { $exists: false },
      },
      {
        $set: {
          status: "seated",
          tableId: table._id,
          seatedAt: new Date(),
        },
        $unset: { activeUserKey: 1 },
      },
      { new: true },
    );

    if (!updatedEntry) {
      // Compensa a reserva da mesa caso o grupo tenha sido alterado
      // por outra operação enquanto a mesa era reservada.
      await RestaurantTable.updateOne(
        {
          _id: table._id,
          businessId: businessObjectId,
          status: "occupied",
          occupiedEntryId: entryObjectId,
        },
        {
          $set: { status: "available", releasedAt: new Date() },
          $unset: { occupiedEntryId: 1, occupiedAt: 1 },
        },
      );

      claimedTableId = null;

      return {
        success: false,
        error: "A fila foi alterada. Atualize a página e tente novamente.",
      };
    }

    refreshWaitlistPaths(businessId);
    revalidatePath("/cliente/fila");
    revalidatePath(`/b/${access.business.slug}/fila`);

    return { success: true };
  } catch (error) {
    // Recuperação de melhor esforço se ocorrer uma falha inesperada
    // depois de reservar a mesa.
    if (claimedTableId) {
      const committedEntry = await WaitlistEntry.exists({
        _id: entryObjectId,
        businessId: businessObjectId,
        status: { $in: ["seated", "completed"] },
        tableId: claimedTableId,
      }).catch(() => null);

      if (committedEntry) {
        refreshWaitlistPaths(businessId);
        revalidatePath("/cliente/fila");
        console.error("seatRestaurantWaitlistEntry: pós-processamento falhou após acomodação confirmada", error);
        return { success: true };
      }

      await RestaurantTable.updateOne(
        {
          _id: claimedTableId,
          businessId: businessObjectId,
          status: "occupied",
          occupiedEntryId: entryObjectId,
        },
        {
          $set: { status: "available", releasedAt: new Date() },
          $unset: { occupiedEntryId: 1, occupiedAt: 1 },
        },
      ).catch(() => undefined);
    }

    console.error("seatRestaurantWaitlistEntry:", error);

    return {
      success: false,
      error: "Não foi possível acomodar o grupo.",
    };
  }
}

const releaseTableSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Restaurante inválido."),
  tableId: z.string().refine(mongoose.isValidObjectId, "Mesa inválida."),
});

export async function releaseRestaurantTable(formData: FormData) {
  const parsed = releaseTableSchema.safeParse({
    businessId: formData.get("businessId"),
    tableId: formData.get("tableId"),
  });

  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const { businessId, tableId } = parsed.data;
  const access = await getOwnedBusiness(businessId);
  if (!access || access.business.category !== "restaurant") {
    return { success: false, error: "Acesso não autorizado." };
  }

  await connectToDatabase();
  const businessObjectId = new mongoose.Types.ObjectId(businessId);
  const tableObjectId = new mongoose.Types.ObjectId(tableId);

  try {
    const table = await RestaurantTable.findOne({
      _id: tableObjectId,
      businessId: businessObjectId,
      active: true,
      status: "occupied",
    }).select("occupiedEntryId").lean();

    if (!table) {
      return { success: false, error: "Mesa não ocupada ou sem grupo associado." };
    }

    let occupiedEntryId = table.occupiedEntryId;
    if (!occupiedEntryId) {
      // Compatibilidade com mesas ocupadas antes da associação explícita.
      const legacyEntries = await WaitlistEntry.find({
        businessId: businessObjectId,
        tableId: tableObjectId,
        status: { $in: ["seated", "completed"] },
      }).select("_id").limit(2).lean();
      if (legacyEntries.length !== 1) {
        return { success: false, error: "Não foi possível identificar com segurança o grupo desta mesa." };
      }
      occupiedEntryId = legacyEntries[0]._id;
      const linked = await RestaurantTable.updateOne(
        {
          _id: tableObjectId,
          businessId: businessObjectId,
          status: "occupied",
          occupiedEntryId: { $in: [null] },
        },
        { $set: { occupiedEntryId } },
      );
      if (linked.modifiedCount !== 1) {
        return { success: false, error: "A associação da mesa mudou. Atualize a página." };
      }
    }

    let entry = await WaitlistEntry.findOne({
      _id: occupiedEntryId,
      businessId: businessObjectId,
    }).select("_id status tableId").lean();

    if (!entry) {
      return { success: false, error: "A associação da mesa precisa ser conferida antes da liberação." };
    }

    if ((entry.status === "waiting" || entry.status === "called") && !entry.tableId) {
      // Recovery path for a process interruption between the table claim and
      // the queue write. Physical release is still confirmed by the operator.
      entry = await WaitlistEntry.findOneAndUpdate(
        {
          _id: occupiedEntryId,
          businessId: businessObjectId,
          status: entry.status,
          tableId: { $exists: false },
        },
        {
          $set: {
            status: "completed",
            tableId: tableObjectId,
            seatedAt: new Date(),
            completedAt: new Date(),
          },
          $unset: { activeUserKey: 1 },
        },
        { new: true },
      ).select("_id status tableId").lean();
      if (!entry) {
        return { success: false, error: "A entrada mudou em outra operação. Atualize a página." };
      }
    }

    const entryMatchesTable =
      entry.tableId?.toString() === tableObjectId.toString() &&
      (entry.status === "seated" || entry.status === "completed");
    const terminalWithoutTable =
      (entry.status === "cancelled" || entry.status === "no_show") && !entry.tableId;
    if (!entryMatchesTable && !terminalWithoutTable) {
      return { success: false, error: "A associação da mesa precisa ser conferida antes da liberação." };
    }

    if (entry.status === "seated") {
      const completedEntry = await WaitlistEntry.findOneAndUpdate(
        {
          _id: occupiedEntryId,
          businessId: businessObjectId,
          status: "seated",
          tableId: tableObjectId,
        },
        { $set: { status: "completed", completedAt: new Date() } },
        { new: true },
      ).select("_id").lean();
      if (!completedEntry) {
        return { success: false, error: "A entrada mudou em outra operação. Atualize a página." };
      }
    }

    const released = await RestaurantTable.findOneAndUpdate(
      {
        _id: tableObjectId,
        businessId: businessObjectId,
        active: true,
        status: "occupied",
        occupiedEntryId,
      },
      {
        $set: { status: "available", releasedAt: new Date() },
        $unset: { occupiedEntryId: 1, occupiedAt: 1 },
      },
      { new: true },
    ).select("_id").lean();

    if (!released) {
      return { success: false, error: "A mesa foi atualizada por outra operação. Atualize a página." };
    }

    refreshWaitlistPaths(businessId);
    revalidatePath("/cliente/fila");
    revalidatePath(`/b/${access.business.slug}/fila`);
    return { success: true };
  } catch (error) {
    console.error("releaseRestaurantTable:", error);
    return { success: false, error: "Não foi possível liberar a mesa." };
  }
}

const leaveWaitlistSchema = z.object({
  businessId: z
    .string()
    .refine(mongoose.isValidObjectId, "Restaurante inválido."),
});

export async function leaveRestaurantWaitlistAsClient(formData: FormData) {
  const user = await getCurrentUser();

  if (!user || user.role !== "client") {
    return {
      success: false,
      error: "Entre na sua conta de cliente para continuar.",
    };
  }

  const parsed = leaveWaitlistSchema.safeParse({
    businessId: formData.get("businessId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Restaurante inválido." };
  }

  await connectToDatabase();

  const businessId = new mongoose.Types.ObjectId(parsed.data.businessId);
  const userId = new mongoose.Types.ObjectId(user.id);

  try {
    const entry = await WaitlistEntry.findOneAndUpdate(
      {
        businessId,
        userId,
        status: { $in: ["waiting", "called"] },
      },
      {
        $set: { status: "cancelled" },
        $unset: { activeUserKey: 1 },
      },
      { new: true },
    );

    if (!entry) {
      return {
        success: false,
        error: "Você não possui uma entrada ativa nesta fila.",
      };
    }

    revalidatePath("/cliente/fila");
    revalidatePath(`/b/${parsed.data.businessId}/fila`);
    revalidatePath(
      `/dashboard/negocios/${parsed.data.businessId}/fila-de-espera`,
    );

    return { success: true };
  } catch (error) {
    console.error("leaveRestaurantWaitlistAsClient:", error);

    return {
      success: false,
      error: "Não foi possível sair da fila. Tente novamente.",
    };
  }
}
