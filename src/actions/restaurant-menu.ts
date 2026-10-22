"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { cloudinary } from "@/lib/cloudinary";

const MENU_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const MENU_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function uploadMenuImage(buffer: Buffer, folder: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [
          { width: 1400, height: 1400, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload sem resultado."));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

const categorySchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
});

const itemSchema = z.object({
  businessId: z.string().refine(mongoose.isValidObjectId),
  categoryId: z.string().refine(mongoose.isValidObjectId),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(600).default(""),
  price: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0).max(999999).optional(),
  ),
});

async function authorizeRestaurant(businessId: string) {
  const access = await getOwnedBusiness(businessId);
  return access?.business.category === "restaurant" ? access : null;
}

function refreshMenu(businessId: string, slug: string) {
  revalidatePath(`/dashboard/negocios/${businessId}/menu`);
  revalidatePath(`/dashboard/negocios/${businessId}`);
  revalidatePath(`/b/${slug}`);
}

export async function createRestaurantMenuCategory(formData: FormData) {
  const parsed = categorySchema.safeParse({
    businessId: formData.get("businessId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { success: false, error: "Confira o nome e a descrição da categoria." };

  const access = await authorizeRestaurant(parsed.data.businessId);
  if (!access) return { success: false, error: "Restaurante não encontrado ou acesso não autorizado." };

  try {
    await connectToDatabase();
    const category = await MenuCategory.create({
      businessId: new mongoose.Types.ObjectId(parsed.data.businessId),
      name: parsed.data.name,
      description: parsed.data.description,
      sortOrder: 0,
      active: true,
    });
    refreshMenu(parsed.data.businessId, access.business.slug);
    return { success: true, categoryId: category._id.toString() };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return { success: false, error: "Já existe uma categoria com esse nome." };
    }
    console.error("createRestaurantMenuCategory:", error);
    return { success: false, error: "Não foi possível criar a categoria." };
  }
}

export async function createRestaurantMenuItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    businessId: formData.get("businessId"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price") ?? "",
  });
  if (!parsed.success) return { success: false, error: "Confira os dados do item." };

  const access = await authorizeRestaurant(parsed.data.businessId);
  if (!access) return { success: false, error: "Restaurante não encontrado ou acesso não autorizado." };

  const file = formData.get("image");
  if (file !== null && file !== "" && !(file instanceof File)) {
    return { success: false, error: "Selecione um arquivo de imagem válido." };
  }
  if (file instanceof File && !MENU_IMAGE_TYPES.has(file.type)) {
    return { success: false, error: "Use uma imagem JPG, PNG, WebP ou AVIF." };
  }
  if (file instanceof File && (file.size <= 0 || file.size > MENU_IMAGE_MAX_SIZE)) {
    return { success: false, error: "A imagem deve ter no máximo 5 MB." };
  }

  let uploadedImage: { secure_url: string; public_id: string } | undefined;
  let imagePersisted = false;
  try {
    await connectToDatabase();
    const category = await MenuCategory.findOne({
      _id: parsed.data.categoryId,
      businessId: parsed.data.businessId,
      active: true,
    }).select("_id").lean();
    if (!category) return { success: false, error: "Selecione uma categoria ativa deste restaurante." };

    if (file instanceof File) {
      uploadedImage = await uploadMenuImage(
        Buffer.from(await file.arrayBuffer()),
        `agenda-flow/businesses/${parsed.data.businessId}/menu`,
      );
    }

    await MenuItem.create({
      businessId: new mongoose.Types.ObjectId(parsed.data.businessId),
      categoryId: category._id,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      imageUrl: uploadedImage?.secure_url ?? "",
      imagePublicId: uploadedImage?.public_id ?? "",
      dietaryTags: [],
      available: true,
      sortOrder: 0,
    });
    imagePersisted = Boolean(uploadedImage);
    refreshMenu(parsed.data.businessId, access.business.slug);
    return { success: true };
  } catch (error) {
    if (uploadedImage?.public_id && !imagePersisted) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id, { resource_type: "image" });
      } catch (cleanupError) {
        console.error("restaurant menu image cleanup:", cleanupError);
      }
    }
    console.error("createRestaurantMenuItem:", error);
    return { success: false, error: "Não foi possível adicionar o item." };
  }
}

export async function updateRestaurantMenuItemImage(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const file = formData.get("image");
  if (!mongoose.isValidObjectId(businessId) || !mongoose.isValidObjectId(itemId)) {
    return { success: false, error: "Item ou restaurante inválido." };
  }
  if (!(file instanceof File)) return { success: false, error: "Selecione uma imagem." };
  if (!MENU_IMAGE_TYPES.has(file.type)) return { success: false, error: "Use JPG, PNG, WebP ou AVIF." };
  if (file.size <= 0 || file.size > MENU_IMAGE_MAX_SIZE) return { success: false, error: "A imagem deve ter no máximo 5 MB." };

  const access = await authorizeRestaurant(businessId);
  if (!access) return { success: false, error: "Acesso não autorizado." };

  let uploadedImage: { secure_url: string; public_id: string } | undefined;
  let imagePersisted = false;
  try {
    await connectToDatabase();
    const current = await MenuItem.findOne({ _id: itemId, businessId }).select("imagePublicId").lean();
    if (!current) return { success: false, error: "Item não encontrado." };

    uploadedImage = await uploadMenuImage(
      Buffer.from(await file.arrayBuffer()),
      `agenda-flow/businesses/${businessId}/menu`,
    );
    const updated = await MenuItem.findOneAndUpdate(
      { _id: itemId, businessId },
      { $set: { imageUrl: uploadedImage.secure_url, imagePublicId: uploadedImage.public_id } },
      { new: true },
    ).select("_id").lean();
    if (!updated) throw new Error("Item não encontrado após o envio.");
    imagePersisted = true;

    if (current.imagePublicId) {
      await cloudinary.uploader.destroy(current.imagePublicId, { resource_type: "image" }).catch((error: unknown) => {
        console.error("restaurant menu old image cleanup:", error);
      });
    }
    refreshMenu(businessId, access.business.slug);
    return { success: true };
  } catch (error) {
    if (uploadedImage?.public_id && !imagePersisted) {
      await cloudinary.uploader.destroy(uploadedImage.public_id, { resource_type: "image" }).catch(() => undefined);
    }
    console.error("updateRestaurantMenuItemImage:", error);
    return { success: false, error: "Não foi possível atualizar a foto do item." };
  }
}

export async function setRestaurantMenuItemAvailability(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const availableValue = String(formData.get("available") ?? "");
  if (!mongoose.isValidObjectId(businessId) || !mongoose.isValidObjectId(itemId) || !["true", "false"].includes(availableValue)) {
    return { success: false, error: "Dados inválidos." };
  }

  const access = await authorizeRestaurant(businessId);
  if (!access) return { success: false, error: "Acesso não autorizado." };

  try {
    await connectToDatabase();
    const item = await MenuItem.findOneAndUpdate(
      { _id: itemId, businessId },
      { $set: { available: availableValue === "true" } },
      { new: true },
    ).select("_id").lean();
    if (!item) return { success: false, error: "Item não encontrado." };
    refreshMenu(businessId, access.business.slug);
    return { success: true };
  } catch (error) {
    console.error("setRestaurantMenuItemAvailability:", error);
    return { success: false, error: "Não foi possível atualizar a disponibilidade." };
  }
}
