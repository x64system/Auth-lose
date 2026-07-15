import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/guards";
import { getClientIp } from "@/lib/security/ip";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req); // FIX CRIT-05
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
      data: { action: "PASSWORD_RESET_REQUEST", message: "Password reset requested (email not sent - not implemented)", userId: user.id }
    });
  }

  // FIX HIGH-06: Não fingir que o email foi enviado quando não foi implementado.
  // Retornar 501 é honesto e evita que o utilizador fique bloqueado para sempre
  // sem saber que o sistema não funciona.
  // TODO: Implementar envio de email (ex: Resend, SendGrid, Nodemailer)
  return NextResponse.json({
    ok: false,
    message: "Recuperação de palavra-passe ainda não está disponível. Contacte o suporte.",
    code: "NOT_IMPLEMENTED"
  }, { status: 501 });
}