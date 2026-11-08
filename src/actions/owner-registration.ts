"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { connectToDatabase } from "@/lib/mongodb";
const schema = z.object({ name: z.string().trim().min(2, "Informe seu nome.").max(100), email: z.string().trim().email("Informe um e-mail válido."), password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(100), acceptedTerms: z.literal("on", { error: "É necessário aceitar os Termos de Uso e a Política de Privacidade." }) });
export type OwnerRegistrationState = { success: boolean; error?: string };
export async function registerOwner(_previous: OwnerRegistrationState, formData: FormData): Promise<OwnerRegistrationState> {
 const parsed = schema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password"), acceptedTerms: formData.get("acceptedTerms") });
 if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
 await connectToDatabase(); const email = parsed.data.email.toLowerCase();
 if (await User.exists({ email })) return { success: false, error: "Já existe uma conta com este e-mail. Entre ou utilize outro endereço." };
 const now = new Date(); const passwordHash = await bcrypt.hash(parsed.data.password, 12); let createdId: unknown;
 try { const user = await User.create({ name: parsed.data.name, email, passwordHash, role: "owner", active: true }); createdId = user._id;
 await Subscription.create({ ownerId: user._id, status: "trialing", trialStartedAt: now, trialEndsAt: new Date(now.getTime() + 30 * 86400000), trialUsedAt: now, provider: "none", additionalBusinesses: 0 });
 return { success: true }; } catch (error) { if (createdId) await User.deleteOne({ _id: createdId }); console.error("registerOwner:", error); return { success: false, error: "Não foi possível criar sua conta agora. Tente novamente." }; }
}
