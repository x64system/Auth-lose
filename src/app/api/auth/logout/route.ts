import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { validateCsrf } from "@/lib/security/guards";

export async function POST(req: Request) {
  // BUG FIX #14: Adicionar proteção CSRF para prevenir logout forçado
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const session = await getSession();
  await destroySession();

  if (session?.sub) {
    await db.log.create({
      data: { action: "LOGOUT", message: "User logout", userId: session.sub }
    });
  }

  return NextResponse.json({ ok: true });
}
