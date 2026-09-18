"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { Client } from "@/models/Client";

const createClientSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().min(10).max(30),
});

export type CreateClientState = {
  success: boolean;
  error?: string;
  client?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    createdAt: string;
  };
};

export async function createClient(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const result = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!result.success) {
    return {
      success: false,
      error: "Preencha os dados corretamente.",
    };
  }

  try {
    await connectToDatabase();

    const existingClient = await Client.findOne({
      email: result.data.email,
      active: true,
    });

    if (existingClient) {
      return {
        success: false,
        error: "Já existe um cliente cadastrado com este e-mail.",
      };
    }

    const client = await Client.create(result.data);
    revalidatePath("/dashboard/clientes");

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
    console.error("Erro ao criar cliente:", error);

    return {
      success: false,
      error: "Não foi possível criar o cliente.",
    };
  }
}
