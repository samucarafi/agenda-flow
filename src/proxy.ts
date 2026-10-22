import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("agenda_flow_session")?.value;
  if (!token) return NextResponse.next();

  const session = await verifySession(token);
  if (!session?.mustChangePassword || request.nextUrl.pathname === "/alterar-senha") {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/alterar-senha", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
