"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

import Business, { BUSINESS_CATEGORIES } from "@/models/Business";
import BusinessMember from "@/models/BusinessMember";
import { revalidatePath } from "next/cache";

const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),

  category: z.enum(BUSINESS_CATEGORIES),

  description: z
    .string()
    .trim()
    .max(1000, "A descrição é muito longa.")
    .optional()
    .or(z.literal("")),
});

export type BusinessActionState = {
  success: boolean;
  error?: string;
  business?: {
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  };
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

async function generateUniqueSlug(name: string) {
  const base = slugify(name) || "negocio";

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = randomBytes(3).toString("hex");
    const slug = `${base}-${suffix}`;

    const exists = await Business.exists({ slug });

    if (!exists) {
      return slug;
    }
  }

  throw new Error("Não foi possível gerar um endereço para o negócio.");
}

export async function createBusiness(
  _previousState: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "Sua sessão expirou. Entre novamente.",
    };
  }

  if (user.role !== "owner") {
    return {
      success: false,
      error: "Você não tem permissão para criar negócios.",
    };
  }

  const parsed = createBusinessSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    await connectToDatabase();

    const slug = await generateUniqueSlug(parsed.data.name);

    const business = await Business.create({
      ownerId: user.id,
      name: parsed.data.name,
      slug,
      category: parsed.data.category,
      description: parsed.data.description ?? "",
      status: "draft",
      timezone: "America/Sao_Paulo",
      theme: {
        template: parsed.data.category,
      },
      bookingSettings: {
        enabled: false,
        confirmationMode: "manual",
        minAdvanceMinutes: 60,
        maxDaysInAdvance: 60,
      },
    });

    // O ownerId é a referência principal de propriedade.
    // A associação também permite evoluir para equipes.
    try {
      await BusinessMember.create({
        businessId: business._id,
        userId: user.id,
        role: "owner",
        active: true,
      });
    } catch (membershipError) {
      // Uma falha de associação não deve deixar o dono
      // sem acesso ao negócio que acabou de criar.
      console.error("createBusiness membership:", membershipError);
    }

    revalidatePath("/dashboard/negocios");

    return {
      success: true,
      business: {
        id: business._id.toString(),
        name: business.name,
        slug: business.slug,
        category: business.category,
        status: business.status,
      },
    };
  } catch (error) {
    console.error("createBusiness:", error);

    return {
      success: false,
      error: "Não foi possível criar o negócio. Tente novamente.",
    };
  }
}
