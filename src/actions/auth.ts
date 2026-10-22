"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/session";
import { clearSession, getCurrentUser, setSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(100, "O nome é muito longo."),

  email: z.string().trim().email("Informe um e-mail válido."),

  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres.")
    .max(100, "A senha é muito longa."),
});

export type AuthState = {
  success: boolean;
  error?: string;
};

export async function login(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await connectToDatabase();

  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
    active: true,
  }).select("+passwordHash");

  if (!user) {
    return {
      success: false,
      error: "E-mail ou senha inválidos.",
    };
  }

  const passwordMatches = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return {
      success: false,
      error: "E-mail ou senha inválidos.",
    };
  }

  const token = await createSession(user._id.toString(), user.mustChangePassword);

  await setSessionCookie(token);

  if (user.role !== "owner" && user.role !== "client") {
    await clearSession();

    return {
      success: false,
      error:
        "Conta sem perfil de acesso configurado. Entre em contato com o suporte.",
    };
  }

  const requestedNext = String(formData.get("next") ?? "");

  const safeNext = /^\/b\/[a-z0-9-]+\/agendar(?:\?service=[a-f\d]{24})?$/i.test(
    requestedNext,
  )
    ? requestedNext
    : null;

  redirect(user.mustChangePassword ? "/alterar-senha" : user.role === "owner" ? "/dashboard" : (safeNext ?? "/cliente"));
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha temporária."),
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres.").max(100, "A senha é muito longa."),
  confirmPassword: z.string().min(1, "Confirme sua nova senha."),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export async function changeTemporaryPassword(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados informados." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: "Entre na sua conta para continuar." };

  await connectToDatabase();
  const user = await User.findOne({ _id: currentUser.id, active: true }).select("+passwordHash");
  if (!user || !user.mustChangePassword) {
    return { success: false, error: "Esta conta não precisa trocar uma senha temporária." };
  }

  const passwordMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!passwordMatches) return { success: false, error: "A senha temporária está incorreta." };

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  user.mustChangePassword = false;
  await user.save();

  const token = await createSession(user._id.toString(), false);
  await setSessionCookie(token);

  redirect(user.role === "owner" ? "/dashboard" : "/cliente/fila");
}

export async function register(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await connectToDatabase();

  const email = parsed.data.email.toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return {
      success: false,
      error: "Já existe uma conta com este e-mail.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await User.create({
    name: parsed.data.name,
    email,
    passwordHash,
    role: "client",
    active: true,
  });

  return {
    success: true,
  };
}

export async function logout() {
  await clearSession();

  redirect("/entrar");
}
