import { SignJWT, jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET não configurado.");
}

const secretKey = new TextEncoder().encode(secret);

export async function createSession(userId: string, mustChangePassword = false) {
  return new SignJWT({
    userId,
    mustChangePassword,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (typeof payload.userId !== "string") {
      return null;
    }

    return {
      userId: payload.userId,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}
