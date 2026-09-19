"use server";

import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { clearSession } from "@/lib/auth";

export type CreateUserState = {
  success: boolean;
  error?: string;
};

export async function createUser(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) {
    return {
      success: false,
      error: "Informe um nome válido.",
    };
  }

  if (!email.includes("@")) {
    return {
      success: false,
      error: "Informe um e-mail válido.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "A senha deve ter pelo menos 8 caracteres.",
    };
  }

  try {
    await connectToDatabase();

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return {
        success: false,
        error: "Já existe um usuário com este e-mail.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      passwordHash,
      active: true,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return {
      success: false,
      error: "Não foi possível criar o usuário.",
    };
  }
}

export type LoginState = {
  success: boolean;
  error?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      success: false,
      error: "Informe seu e-mail e sua senha.",
    };
  }

  try {
    await connectToDatabase();

    const user = await User.findOne({
      email,
      active: true,
    }).select("+passwordHash");

    if (!user) {
      return {
        success: false,
        error: "E-mail ou senha inválidos.",
      };
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return {
        success: false,
        error: "E-mail ou senha inválidos.",
      };
    }

    const token = await createSession(user._id.toString());

    await setSessionCookie(token);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return {
      success: false,
      error: "Não foi possível realizar o login.",
    };
  }
}

export async function logout() {
  await clearSession();
}
