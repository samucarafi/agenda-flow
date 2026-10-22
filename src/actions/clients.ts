"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/models/Client";

export interface CreateClientState {
  success: boolean;
  error?: string;
  alreadyExists?: boolean;
  client?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    createdAt: string;
  };
}

const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres.")
    .max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(150),
  phone: z.string().trim().min(10, "Informe um telefone válido.").max(30),
});

export async function createClient(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const businessId = String(formData.get("businessId") ?? "");
  const businessAccess = await getOwnedBusiness(businessId);

  if (!businessAccess) {
    return {
      success: false,
      error: "Negócio não encontrado ou acesso não autorizado.",
    };
  }

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Verifique os dados do cliente.",
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  try {
    await connectToDatabase();

    const existingClient = await Client.findOne({
      businessId,
      email: normalizedEmail,
    });

    if (existingClient) {
      if (!existingClient.active) {
        existingClient.active = true;
        existingClient.name = parsed.data.name;
        existingClient.phone = parsed.data.phone;
        await existingClient.save();
      }
      revalidatePath(`/dashboard/negocios/${businessId}/clientes`);
      return {
        success: true,
        alreadyExists: true,
        client: {
          _id: existingClient._id.toString(),
          name: existingClient.name,
          email: existingClient.email,
          phone: existingClient.phone,
          active: existingClient.active,
          createdAt: existingClient.createdAt.toISOString(),
        },
      };
    }

    const client = await Client.create({
      ...parsed.data,
      email: normalizedEmail,
      businessId,
      active: true,
    });

    revalidatePath(`/dashboard/negocios/${businessId}/clientes`);

    return {
      success: true,
      client: {
        _id: client._id.toString(),
        name: client.name,
        email: client.email,
        phone: client.phone,
        active: client.active,
        createdAt: client.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      const existingClient = await Client.findOne({ businessId, email: normalizedEmail }).lean();
      if (existingClient) {
        return {
          success: true,
          alreadyExists: true,
          client: {
            _id: existingClient._id.toString(),
            name: existingClient.name,
            email: existingClient.email,
            phone: existingClient.phone,
            active: existingClient.active,
            createdAt: existingClient.createdAt.toISOString(),
          },
        };
      }
    }
    return {
      success: false,
      error: "Não foi possível cadastrar o cliente. Tente novamente.",
    };
  }
}
