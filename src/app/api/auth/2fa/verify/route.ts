import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { rateLimit, validateCsrf } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`2fa-verify:${session.sub}`, 10, 60_000);
  if (limited) return limited;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const secret = typeof body?.secret === "string" ? body.secret : "";

  // BUG FIX: Aceitar o segredo como parâmetro para verificar ANTES de salvar
  // no banco, eliminando a race condition onde o segredo era salvo antes da
  // verificação do código TOTP.
  if (!secret) {
    return NextResponse.json({ error: "Secret required" }, { status: 400 });
  }

  const valid = authenticator.verify({ token, secret });
  if (!valid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Apenas agora, após verificação bem-sucedida, salvar o segredo
  await db.user.update({
    where: { id: session.sub },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true
    }
  });

  await db.log.create({
    data: { action: "2FA_ENABLED", message: "Two-factor authentication enabled", userId: session.sub }
  });

  return NextResponse.json({ ok: true });
}
