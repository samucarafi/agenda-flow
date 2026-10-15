"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import Service from "@/models/Service";

const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(100),
  description: z.string().trim().max(500).default(""),
  duration: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0).max(999999),
});

export interface CreateServiceState {
  success: boolean;
  error?: string;
  service?: {
    _id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    active: boolean;
    createdAt: string;
  };
}

function refreshBusinessPaths(businessId: string) {
  revalidatePath(`/dashboard/negocios/${businessId}`);
  revalidatePath(`/dashboard/negocios/${businessId}/servicos`);
}

export async function createService(
  _previousState: CreateServiceState,
  formData: FormData,
): Promise<CreateServiceState> {
  const businessId = String(formData.get("businessId") ?? "");
  const businessAccess = await getOwnedBusiness(businessId);

  if (!businessAccess) {
    return {
      success: false,
      error: "Negócio não encontrado ou acesso não autorizado.",
    };
  }

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    duration: formData.get("duration"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Verifique os dados do serviço.",
    };
  }

  try {
    await connectToDatabase();

    const existingService = await Service.findOne({
      businessId,
      name: parsed.data.name,
    }).select("_id");

    if (existingService) {
      return {
        success: false,
        error:
          "Já existe um serviço com esse nome neste negócio. Verifique também os inativos.",
      };
    }

    const service = await Service.create({
      ...parsed.data,
      businessId,
      active: true,
    });

    refreshBusinessPaths(businessId);

    return {
      success: true,
      service: {
        _id: service._id.toString(),
        name: service.name,
        description: service.description ?? "",
        duration: service.duration,
        price: service.price,
        active: service.active,
        createdAt: service.createdAt.toISOString(),
      },
    };
  } catch {
    return {
      success: false,
      error: "Não foi possível criar o serviço. Tente novamente.",
    };
  }
}

export async function updateService(
  serviceId: string,
  formData: FormData,
): Promise<CreateServiceState> {
  const businessId = String(formData.get("businessId") ?? "");
  const businessAccess = await getOwnedBusiness(businessId);

  if (!businessAccess) {
    return {
      success: false,
      error: "Negócio não encontrado ou acesso não autorizado.",
    };
  }

  if (!serviceId || serviceId.length > 100) {
    return { success: false, error: "Serviço inválido." };
  }

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    duration: formData.get("duration"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Verifique os dados do serviço.",
    };
  }

  try {
    await connectToDatabase();

    const duplicate = await Service.findOne({
      businessId,
      name: parsed.data.name,
      _id: { $ne: serviceId },
    }).select("_id");

    if (duplicate) {
      return {
        success: false,
        error: "Já existe outro serviço com esse nome neste negócio.",
      };
    }

    const updated = await Service.findOneAndUpdate(
      { _id: serviceId, businessId },
      { $set: parsed.data },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return { success: false, error: "Serviço não encontrado neste negócio." };
    }

    refreshBusinessPaths(businessId);

    return {
      success: true,
      service: {
        _id: updated._id.toString(),
        name: updated.name,
        description: updated.description ?? "",
        duration: updated.duration,
        price: updated.price,
        active: updated.active,
        createdAt: updated.createdAt.toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Não foi possível atualizar o serviço." };
  }
}

export async function deleteService(
  serviceId: string,
  businessId: string,
): Promise<{ success: boolean; error?: string }> {
  const businessAccess = await getOwnedBusiness(businessId);

  if (!businessAccess) {
    return { success: false, error: "Acesso não autorizado." };
  }

  try {
    await connectToDatabase();

    const service = await Service.findOneAndUpdate(
      { _id: serviceId, businessId, active: true },
      { $set: { active: false } },
      { new: true },
    );

    if (!service) {
      return {
        success: false,
        error: "Serviço não encontrado ou já desativado.",
      };
    }

    refreshBusinessPaths(businessId);
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível desativar o serviço." };
  }
}

export async function restoreService(
  serviceId: string,
  businessId: string,
): Promise<{ success: boolean; error?: string }> {
  const businessAccess = await getOwnedBusiness(businessId);

  if (!businessAccess) {
    return { success: false, error: "Acesso não autorizado." };
  }

  try {
    await connectToDatabase();

    const service = await Service.findOneAndUpdate(
      { _id: serviceId, businessId, active: false },
      { $set: { active: true } },
      { new: true },
    );

    if (!service) {
      return { success: false, error: "Serviço não encontrado ou já ativo." };
    }

    refreshBusinessPaths(businessId);
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível reativar o serviço." };
  }
}
