"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business, { BUSINESS_CATEGORIES } from "@/models/Business";
import BusinessMember from "@/models/BusinessMember";
import Service from "@/models/Service";
import Appointment from "@/models/Appointment";
import { Client } from "@/models/Client";

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

export async function deleteBusiness(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");

  const businessId = String(formData.get("businessId") || "");

  if (!mongoose.isValidObjectId(businessId)) {
    redirect("/dashboard/negocios");
  }

  await connectToDatabase();

  const business = await Business.findOne({
    _id: businessId,
    ownerId: user.id,
  }).select("_id slug");

  if (!business) {
    redirect("/dashboard/negocios");
  }

  // Bloqueia novas reservas antes de remover os dados relacionados.
  business.set("status", "suspended");
  business.set("bookingSettings.enabled", false);
  await business.save();

  try {
    await Appointment.deleteMany({ businessId: business._id });
    await Client.deleteMany({ businessId: business._id });
    await Service.deleteMany({ businessId: business._id });
    await BusinessMember.deleteMany({ businessId: business._id });

    await Business.deleteOne({
      _id: business._id,
      ownerId: user.id,
    });

    revalidatePath("/dashboard/negocios");
    revalidatePath(`/b/${business.slug}`);
    revalidatePath(`/b/${business.slug}/agendar`);
  } catch (error) {
    console.error("deleteBusiness:", error);

    // Se a exclusão falhar, o negócio permanece suspenso,
    // evitando novas reservas até que o problema seja resolvido.
    redirect(`/dashboard/negocios?error=delete`);
  }

  redirect("/dashboard/negocios?success=deleted");
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
      availability: {
        workingDays: [1, 2, 3, 4, 5, 6],
        openingTime: "09:00",
        closingTime: "18:00",
        slotIntervalMinutes: 30,
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
    redirect(`/dashboard/negocios/${business._id.toString()}/configuracoes`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String(error.digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("createBusiness:", error);

    return {
      success: false,
      error: "Não foi possível criar o negócio. Tente novamente.",
    };
  }
}

export async function saveBusinessSettings(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");

  const businessId = String(formData.get("businessId") || "");

  if (!mongoose.isValidObjectId(businessId)) {
    redirect("/dashboard/negocios");
  }

  const intent = formData.get("intent") === "publish" ? "publish" : "save";

  const workingDays = formData
    .getAll("workingDays")
    .map((value) => Number(value));

  const schema = z.object({
    openingTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    closingTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    slotIntervalMinutes: z.coerce
      .number()
      .int()
      .refine((value) => [15, 30, 60].includes(value)),
    minAdvanceMinutes: z.coerce.number().int().min(0).max(10080),
    maxDaysInAdvance: z.coerce.number().int().min(1).max(365),
    confirmationMode: z.enum(["manual", "automatic"]),
    address: z
      .string()
      .trim()
      .max(300, "O endereço deve ter no máximo 300 caracteres.")
      .default(""),
    primaryColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#0F172A"),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#06B6D4"),
    themeTemplate: z.enum(["default", "minimal", "bold"]).default("default"),
  });

  const parsed = schema.safeParse({
    openingTime: formData.get("openingTime"),
    closingTime: formData.get("closingTime"),
    slotIntervalMinutes: formData.get("slotIntervalMinutes"),
    minAdvanceMinutes: formData.get("minAdvanceMinutes"),
    maxDaysInAdvance: formData.get("maxDaysInAdvance"),
    confirmationMode: formData.get("confirmationMode"),
    primaryColor: formData.get("primaryColor"),
    address: formData.get("address") ?? "",
    accentColor: formData.get("accentColor"),
    themeTemplate: formData.get("themeTemplate"),
  });

  const settingsUrl = `/dashboard/negocios/${businessId}/configuracoes`;

  if (!parsed.success) {
    redirect(`${settingsUrl}?error=invalid`);
  }

  if (
    workingDays.length === 0 ||
    workingDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
    new Set(workingDays).size !== workingDays.length
  ) {
    redirect(`${settingsUrl}?error=days`);
  }

  const {
    openingTime,
    closingTime,
    slotIntervalMinutes,
    minAdvanceMinutes,
    address,
    maxDaysInAdvance,
    confirmationMode,
    primaryColor,
    accentColor,
    themeTemplate,
  } = parsed.data;

  if (openingTime >= closingTime) {
    redirect(`${settingsUrl}?error=hours`);
  }

  try {
    await connectToDatabase();

    const business = await Business.findOne({
      _id: businessId,
      ownerId: user.id,
    });

    if (!business) {
      redirect("/dashboard/negocios");
    }

    if (intent === "publish") {
      const activeServices = await Service.countDocuments({
        businessId: business._id,
        active: true,
      });

      if (activeServices === 0) {
        redirect(`${settingsUrl}?error=services`);
      }

      business.set("status", "active");
      business.set("bookingSettings.enabled", true);
    }

    business.set("availability", {
      workingDays,
      openingTime,
      closingTime,
      slotIntervalMinutes,
    });

    business.set("bookingSettings.minAdvanceMinutes", minAdvanceMinutes);
    business.set("bookingSettings.maxDaysInAdvance", maxDaysInAdvance);
    business.set("bookingSettings.confirmationMode", confirmationMode);
    business.set("theme.template", themeTemplate);
    business.set("theme.primaryColor", primaryColor);
    business.set("theme.accentColor", accentColor);
    business.set("address", address);

    await business.save();

    revalidatePath("/dashboard/negocios");
    revalidatePath(`/dashboard/negocios/${businessId}`);
    revalidatePath(`${settingsUrl}`);
    revalidatePath(`/b/${business.slug}`);
    revalidatePath(`/b/${business.slug}/agendar`);
  } catch (error) {
    const digest =
      typeof error === "object" && error !== null && "digest" in error
        ? String(error.digest)
        : "";

    if (digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("saveBusinessSettings:", error);

    redirect(`${settingsUrl}?error=save`);
  }

  redirect(`${settingsUrl}?success=${intent}`);
}
