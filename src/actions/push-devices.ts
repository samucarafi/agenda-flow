"use server";

import mongoose from "mongoose";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PushDevice from "@/models/PushDevice";

const registerSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(["android", "ios"]),
});

export async function registerPushDevice(input: {
  token: string;
  platform: "android" | "ios";
}) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Entre na sua conta para ativar notificações." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Token de dispositivo inválido." };
  }

  await connectToDatabase();

  try {
    await PushDevice.findOneAndUpdate(
      { token: parsed.data.token },
      {
        $set: {
          userId: new mongoose.Types.ObjectId(user.id),
          platform: parsed.data.platform,
          active: true,
          lastUsedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return { success: true };
  } catch (error) {
    console.error("registerPushDevice:", error);
    return { success: false, error: "Não foi possível registrar este dispositivo." };
  }
}

export async function deactivateCurrentPushDevice(token: string) {
  const user = await getCurrentUser();
  if (!user || typeof token !== "string" || token.length < 20 || token.length > 4096) {
    return { success: false };
  }

  await connectToDatabase();

  await PushDevice.updateOne(
    { userId: user.id, token },
    { $set: { active: false } },
  );

  return { success: true };
}
