import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { cloudinary } from "@/lib/cloudinary";
import Business from "@/models/Business";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 12;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type RouteContext = { params: Promise<{ businessId: string }> };
type GalleryImage = { url: string; publicId: string; isCover: boolean };

async function getOwnedBusiness(businessId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return { response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }) };
  }

  if (!mongoose.isValidObjectId(businessId)) {
    return { response: NextResponse.json({ error: "Estabelecimento inválido." }, { status: 400 }) };
  }

  await connectToDatabase();
  const business = await Business.findOne({ _id: businessId, ownerId: user.id });
  if (!business) {
    return { response: NextResponse.json({ error: "Estabelecimento não encontrado." }, { status: 404 }) };
  }

  return { business };
}

function uploadBuffer(buffer: Buffer, folder: string): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [
          { width: 1800, height: 1800, crop: "limit" },
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

export async function POST(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const owned = await getOwnedBusiness(businessId);
  if ("response" in owned) return owned.response;

  const { business } = owned;
  const currentGallery = (business.gallery ?? []) as GalleryImage[];
  if (currentGallery.length >= MAX_IMAGES) {
    return NextResponse.json({ error: `O limite é de ${MAX_IMAGES} fotos por estabelecimento.` }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o arquivo enviado." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione uma imagem para enviar." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WebP ou AVIF." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Cada foto deve ter no máximo 5 MB." }, { status: 400 });
  }

  let uploaded: { secure_url: string; public_id: string } | undefined;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // A extensão e o MIME enviados pelo navegador não são considerados confiáveis.
    // O Cloudinary também valida o conteúdo real do arquivo durante o processamento.
    uploaded = await uploadBuffer(buffer, `agenda-flow/businesses/${business._id.toString()}`);

    const image: GalleryImage = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      isCover: currentGallery.length === 0,
    };

    business.gallery = [...currentGallery, image] as typeof business.gallery;
    await business.save();

    return NextResponse.json({ gallery: business.gallery }, { status: 201 });
  } catch (error) {
    if (uploaded?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: "image" });
      } catch (cleanupError) {
        console.error("cloudinary upload cleanup:", cleanupError);
      }
    }
    console.error("business gallery upload:", error);
    return NextResponse.json({ error: "Não foi possível salvar a foto. Tente novamente." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const owned = await getOwnedBusiness(businessId);
  if ("response" in owned) return owned.response;

  const { business } = owned;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("publicId" in body) || typeof body.publicId !== "string") {
    return NextResponse.json({ error: "Foto inválida." }, { status: 400 });
  }

  const gallery = (business.gallery ?? []) as GalleryImage[];
  if (!gallery.some((image) => image.publicId === body.publicId)) {
    return NextResponse.json({ error: "Esta foto não pertence ao estabelecimento." }, { status: 404 });
  }

  business.gallery = gallery.map((image) => ({
    ...image,
    isCover: image.publicId === body.publicId,
  })) as typeof business.gallery;
  await business.save();
  return NextResponse.json({ gallery: business.gallery });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const owned = await getOwnedBusiness(businessId);
  if ("response" in owned) return owned.response;

  const { business } = owned;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("publicId" in body) || typeof body.publicId !== "string") {
    return NextResponse.json({ error: "Foto inválida." }, { status: 400 });
  }

  const gallery = (business.gallery ?? []) as GalleryImage[];
  const image = gallery.find((item) => item.publicId === body.publicId);
  if (!image) {
    return NextResponse.json({ error: "Esta foto não pertence ao estabelecimento." }, { status: 404 });
  }

  try {
    await cloudinary.uploader.destroy(image.publicId, { resource_type: "image", invalidate: true });
    const remaining = gallery.filter((item) => item.publicId !== image.publicId);
    if (image.isCover && remaining.length > 0) remaining[0].isCover = true;
    business.gallery = remaining as typeof business.gallery;
    await business.save();
    return NextResponse.json({ gallery: business.gallery });
  } catch (error) {
    console.error("business gallery delete:", error);
    return NextResponse.json({ error: "Não foi possível remover a foto." }, { status: 500 });
  }
}
