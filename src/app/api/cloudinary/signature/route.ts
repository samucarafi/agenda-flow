import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { cloudinary } from "@/lib/cloudinary";
import Business from "@/models/Business";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "owner") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("businessId" in body) ||
      typeof body.businessId !== "string" ||
      !mongoose.isValidObjectId(body.businessId)
    ) {
      return NextResponse.json(
        { error: "Estabelecimento inválido." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const business = await Business.findOne({
      _id: body.businessId,
      ownerId: user.id,
    })
      .select("_id")
      .lean();

    if (!business) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado." },
        { status: 404 },
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `agenda-flow/businesses/${business._id.toString()}`;
    const paramsToSign = { folder, timestamp };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    console.error("cloudinary signature:", error);

    return NextResponse.json(
      { error: "Não foi possível preparar o envio da imagem." },
      { status: 500 },
    );
  }
}
