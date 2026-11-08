"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import { formatBrazilianPhone, isValidBrazilianPhone } from "@/lib/phone";
import Client from "@/models/Client";
import User from "@/models/User";

export interface ClientSummary {
  _id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
  hasAccount: boolean;
  mustChangePassword: boolean;
}

export interface CreateClientState {
  success: boolean;
  error?: string;
  alreadyExists?: boolean;
  accountCreated?: boolean;
  temporaryPassword?: string;
  client?: ClientSummary;
}

const clientSchema = z.object({
  name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres.").max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(150),
  phone: z.string()
    .trim()
    .refine(isValidBrazilianPhone, "Informe um telefone com DDD e 10 ou 11 dígitos.")
    .transform(formatBrazilianPhone),
});

function generateTemporaryPassword() {
  return `Agenda-${randomInt(100000, 1000000)}!`;
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function createClient(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const businessId = String(formData.get("businessId") ?? "");

  if (!mongoose.isValidObjectId(businessId)) {
    return { success: false, error: "Negócio inválido." };
  }

  const access = await getOwnedBusiness(businessId);
  if (!access) {
    return { success: false, error: "Negócio não encontrado ou acesso não autorizado." };
  }

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Verifique os dados do cliente.",
    };
  }

  await connectToDatabase();

  const email = parsed.data.email.toLowerCase();
  let temporaryPassword: string | undefined;
  let accountCreated = false;

  try {
    let user = await User.findOne({ email });

    if (user && user.role !== "client" && user.role !== "owner") {
      return {
        success: false,
        error: "Este e-mail pertence a uma conta de proprietário. Informe outro e-mail.",
      };
    }

    if (user && !user.active) {
      return {
        success: false,
        error: "Esta conta está desativada. O cliente precisa entrar em contato com o suporte.",
      };
    }

    if (!user) {
      temporaryPassword = generateTemporaryPassword();

      try {
        user = await User.create({
          name: parsed.data.name,
          email,
          passwordHash: await bcrypt.hash(temporaryPassword, 12),
          role: "client",
          active: true,
          mustChangePassword: true,
        });
        accountCreated = true;
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;

        user = await User.findOne({ email });
        temporaryPassword = undefined;

        if (!user || (user.role !== "client" && user.role !== "owner") || !user.active) {
          return { success: false, error: "Não foi possível associar uma conta de cliente a este e-mail." };
        }
      }
    }

    const userId = user._id as mongoose.Types.ObjectId;
    let client = await Client.findOne({ businessId, email });
    const alreadyExists = Boolean(client);

    if (client) {
      client.name = parsed.data.name;
      client.phone = parsed.data.phone;
      client.active = true;
      client.accountUserId = userId;
      await client.save();
    } else {
      try {
        client = await Client.create({
          ...parsed.data,
          email,
          businessId,
          accountUserId: userId,
          active: true,
        });
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;

        client = await Client.findOne({ businessId, email });
        if (!client) throw error;

        client.name = parsed.data.name;
        client.phone = parsed.data.phone;
        client.active = true;
        client.accountUserId = userId;
        await client.save();
      }
    }

    revalidatePath(`/dashboard/negocios/${businessId}/clientes`);

    return {
      success: true,
      alreadyExists,
      accountCreated,
      ...(temporaryPassword ? { temporaryPassword } : {}),
      client: {
        _id: client._id.toString(),
        name: client.name,
        email: client.email,
        phone: client.phone,
        active: client.active,
        createdAt: client.createdAt.toISOString(),
        hasAccount: true,
        mustChangePassword: user.mustChangePassword,
      },
    };
  } catch (error) {
    console.error("createClient:", error);
    return {
      success: false,
      error: "Não foi possível cadastrar o cliente. Tente novamente.",
    };
  }
}

const resetSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId, "Negócio inválido."),
  clientId: z.string().refine(mongoose.isValidObjectId, "Cliente inválido."),
});

export async function resetClientTemporaryPassword(formData: FormData) {
  const parsed = resetSchema.safeParse({
    businessId: formData.get("businessId"),
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { businessId, clientId } = parsed.data;
  const access = await getOwnedBusiness(businessId);

  if (!access) {
    return { success: false as const, error: "Acesso não autorizado." };
  }

  await connectToDatabase();

  try {
    const client = await Client.findOne({
      _id: clientId,
      businessId,
      active: true,
    }).select("accountUserId");

    if (!client?.accountUserId) {
      return { success: false as const, error: "Este cliente ainda não possui uma conta de acesso." };
    }

    const user = await User.findOne({
      _id: client.accountUserId,
      role: { $in: ["client", "owner"] },
      active: true,
    });

    if (!user) {
      return { success: false as const, error: "Conta de cliente não encontrada ou desativada." };
    }

    const temporaryPassword = generateTemporaryPassword();
    user.passwordHash = await bcrypt.hash(temporaryPassword, 12);
    user.mustChangePassword = true;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();

    revalidatePath(`/dashboard/negocios/${businessId}/clientes`);

    return {
      success: true as const,
      email: user.email,
      temporaryPassword,
    };
  } catch (error) {
    console.error("resetClientTemporaryPassword:", error);
    return { success: false as const, error: "Não foi possível redefinir a senha." };
  }
}
