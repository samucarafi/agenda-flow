"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { Service } from "@/models/Service";

const createServiceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500),
  duration: z.coerce.number().min(5).max(480),
  price: z.coerce.number().min(0).max(999999),
});

export type CreateServiceState = {
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
};

export async function createService(
  _previousState: CreateServiceState,
  formData: FormData,
): Promise<CreateServiceState> {
  const result = createServiceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    duration: formData.get("duration"),
    price: formData.get("price"),
  });

  if (!result.success) {
    return {
      success: false,
      error: "Preencha os dados do serviço corretamente.",
    };
  }

  try {
    await connectToDatabase();

    const existingService = await Service.findOne({
      name: result.data.name,
      active: true,
    });

    if (existingService) {
      return {
        success: false,
        error: "Já existe um serviço ativo com esse nome.",
      };
    }

    const service = await Service.create(result.data);

    revalidatePath("/dashboard/servicos");

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
  } catch (error) {
    console.error("Erro ao criar serviço:", error);

    return {
      success: false,
      error: "Não foi possível criar o serviço.",
    };
  }
}

export async function updateService(
  serviceId: string,
  formData: FormData,
): Promise<CreateServiceState> {
  const result = createServiceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    duration: formData.get("duration"),
    price: formData.get("price"),
  });

  if (!result.success) {
    return {
      success: false,
      error: "Preencha os dados do serviço corretamente.",
    };
  }

  try {
    await connectToDatabase();

    const existingService = await Service.findOne({
      name: result.data.name,
      active: true,
      _id: { $ne: serviceId },
    });

    if (existingService) {
      return {
        success: false,
        error: "Já existe outro serviço com esse nome.",
      };
    }

    const service = await Service.findByIdAndUpdate(serviceId, result.data, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return {
        success: false,
        error: "Serviço não encontrado.",
      };
    }

    revalidatePath("/dashboard/servicos");

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
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);

    return {
      success: false,
      error: "Não foi possível atualizar o serviço.",
    };
  }
}

export async function deleteService(serviceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectToDatabase();

    const service = await Service.findByIdAndUpdate(
      serviceId,
      {
        active: false,
      },
      {
        new: true,
      },
    );

    if (!service) {
      return {
        success: false,
        error: "Serviço não encontrado.",
      };
    }

    revalidatePath("/dashboard/servicos");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);

    return {
      success: false,
      error: "Não foi possível excluir o serviço.",
    };
  }
}
