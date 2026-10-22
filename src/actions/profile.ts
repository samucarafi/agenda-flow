"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export type ProfileActionState = { success: boolean; error?: string; message?: string };

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100, "O nome é muito longo."),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  currentPassword: z.string().min(1, "Informe sua senha atual para confirmar as alterações."),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual."),
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres.").max(100, "A senha é muito longa."),
  confirmPassword: z.string().min(1, "Confirme a nova senha."),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

async function getAccountForPasswordCheck(userId: string) {
  await connectToDatabase();
  return User.findOne({ _id: userId, active: true }).select("+passwordHash");
}

function refreshProfile() {
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/cliente");
  revalidatePath("/cliente/fila");
}

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira seus dados." };

  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: "Entre novamente para continuar." };
  const account = await getAccountForPasswordCheck(currentUser.id);
  if (!account) return { success: false, error: "Sua conta não está disponível." };

  const passwordMatches = await bcrypt.compare(parsed.data.currentPassword, account.passwordHash);
  if (!passwordMatches) return { success: false, error: "A senha atual está incorreta." };

  const email = parsed.data.email.toLowerCase();
  try {
    const emailInUse = await User.exists({ email, _id: { $ne: account._id }, active: true });
    if (emailInUse) return { success: false, error: "Este e-mail já está associado a outra conta." };

    account.name = parsed.data.name;
    account.email = email;
    await account.save();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return { success: false, error: "Este e-mail já está associado a outra conta." };
    }
    console.error("updateProfile:", error);
    return { success: false, error: "Não foi possível salvar seu perfil. Tente novamente." };
  }

  refreshProfile();
  return { success: true, message: "Seus dados foram atualizados." };
}

export async function changeAccountPassword(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados informados." };
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { success: false, error: "Escolha uma senha diferente da atual." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: "Entre novamente para continuar." };
  const account = await getAccountForPasswordCheck(currentUser.id);
  if (!account) return { success: false, error: "Sua conta não está disponível." };

  const passwordMatches = await bcrypt.compare(parsed.data.currentPassword, account.passwordHash);
  if (!passwordMatches) return { success: false, error: "A senha atual está incorreta." };

  account.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  account.mustChangePassword = false;
  await account.save();
  refreshProfile();
  return { success: true, message: "Sua senha foi alterada." };
}
