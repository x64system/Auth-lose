import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`forgot:${ip}`, 5, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    await db.log.create({
      data: { action: "PASSWORD_RESET_REQUEST", message: "Password reset requested", userId: user.id }
    });
  }

  // Não revelamos se o email existe (evita enumeração de utilizadores).
  return NextResponse.json({ ok: true, message: "Se o email existir, enviámos um link de recuperação." });
}