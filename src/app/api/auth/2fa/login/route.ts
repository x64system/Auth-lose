import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { db } from "@/lib/prisma";
import { issueSession, verifyPendingTwoFactorToken } from "@/lib/auth";
import { twoFactorLoginSchema } from "@/lib/validators";
import { rateLimit, validateCsrf } from "@/lib/security/guards";

/**
 * POST /api/auth/2fa/login
 *
 * Passo 2 do login quando a conta tem 2FA ativo. Recebe o `pendingToken`
 * devolvido por /api/auth/login (prova que a password já foi validada) e o
 * código TOTP atual. Só aqui é que a sessão real é emitida.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = twoFactorLoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const pending = await verifyPendingTwoFactorToken(parsed.data.pendingToken);
  if (!pending) return NextResponse.json({ error: "Sessão de verificação expirada, faça login novamente" }, { status: 401 });

  // BUG FIX: Rate limit por usuário além do rate limit por IP para prevenir
  // brute force de códigos 2FA mesmo vindo de IPs diferentes
  const userLimited = rateLimit(`2fa-login-user:${pending.userId}`, 10, 60_000);
  if (userLimited) return userLimited;
  const ipLimited = rateLimit(`2fa-login:${ip}`, 10, 60_000);
  if (ipLimited) return ipLimited;

  const user = await db.user.findUnique({ where: { id: pending.userId } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 401 });
  if (user.isBanned) return NextResponse.json({ error: "User banned" }, { status: 403 });
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA não está ativo nesta conta" }, { status: 400 });
  }

  const validTotp = authenticator.verify({ token: parsed.data.totpToken, secret: user.twoFactorSecret });
  if (!validTotp) return NextResponse.json({ error: "Código 2FA inválido" }, { status: 401 });

  await issueSession(
    { id: user.id, email: user.email, role: user.role },
    { ip, userAgent: req.headers.get("user-agent") }
  );

  await db.log.create({
    data: { action: "LOGIN", message: "User login successful (2FA)", userId: user.id, ip }
  });

  return NextResponse.json({ ok: true, role: user.role });
}
