import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { db } from "@/lib/prisma";
import { issueSession, verifyPassword, createPendingTwoFactorToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { rateLimit, validateCsrf } from "@/lib/security/guards";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`login:${ip}`, 10, 60_000);
  if (limited) return limited;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // BUG FIX #13: Rate limit também por email para prevenir credential stuffing distribuído
  const emailLimited = rateLimit(`login:${parsed.data.email}`, 5, 60_000);
  if (emailLimited) return emailLimited;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  if (user.isBanned) return NextResponse.json({ error: "User banned" }, { status: 403 });

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  // Passo 2: se o utilizador tem 2FA ativo, exige o código TOTP antes de
  // emitir qualquer sessão. Sem código, devolve apenas um token efémero
  // (5 min, sem qualquer acesso) que prova que a password já foi validada.
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    if (!parsed.data.totpToken) {
      const pendingToken = await createPendingTwoFactorToken(user.id);
      return NextResponse.json({ requires2FA: true, pendingToken });
    }

    const validTotp = authenticator.verify({ token: parsed.data.totpToken, secret: user.twoFactorSecret });
    if (!validTotp) return NextResponse.json({ error: "Código 2FA inválido" }, { status: 401 });
  }

  await issueSession(
    { id: user.id, email: user.email, role: user.role },
    { rememberMe: parsed.data.rememberMe, ip, userAgent: req.headers.get("user-agent") }
  );

  await db.log.create({
    data: { action: "LOGIN", message: "User login successful", userId: user.id, ip }
  });

  return NextResponse.json({ ok: true, role: user.role });
}
