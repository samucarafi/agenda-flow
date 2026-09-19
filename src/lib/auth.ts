import { cookies } from "next/headers";

import { verifySession } from "./session";
import User from "@/models/User";
const SESSION_COOKIE = "agenda_flow_session";

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await User.findOne({
    _id: session.userId,
    active: true,
  })
    .select("_id name email")
    .lean();

  if (!user) {
    await clearSession();

    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
