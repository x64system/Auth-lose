import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import { resolveJwtSecretBytes } from "@/lib/security/jwt-secret";

const secret = resolveJwtSecretBytes();
const cookieName = "inject_bypass_session";
const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 24; // 24h
const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 dias
const PENDING_2FA_MAX_AGE = 60 * 5; // 5 minutos

export type SessionPayload = {
  sub: string;
  role: string;
  email: string;
};

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Emite uma sessão completa: assina o JWT, grava o registo em `Session`
 * (permite invalidação real no logout/ban/troca de role) e define o cookie
 * HttpOnly.
 */
export async function issueSession(
  user: SessionUser,
  opts: { rememberMe?: boolean; ip?: string | null; userAgent?: string | null } = {}
) {
  const maxAge = opts.rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  const token = await new SignJWT({ sub: user.id, role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  await db.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
      ipAddress: opts.ip ?? undefined,
      userAgent: opts.userAgent ?? undefined
    }
  });

  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  });

  return token;
}

/**
 * Termina a sessão atual: remove o registo em `Session` (invalidação real,
 * não apenas apagar o cookie do lado do cliente) e limpa o cookie.
 */
export async function destroySession() {
  const token = cookies().get(cookieName)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => null);
  }
  cookies().delete(cookieName);
}

/**
 * Lê e valida a sessão atual: o JWT tem de ser válido E ter um registo
 * correspondente ativo em `Session` — isto permite revogar sessões de
 * imediato (logout, ban, refresh) mesmo que o JWT ainda não tenha expirado.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as SessionPayload;

    const session = await db.session.findUnique({
      where: { token },
      include: { user: { select: { isBanned: true, role: true } } }
    });
    if (!session || session.expiresAt < new Date() || !session.user || session.user.isBanned) {
      return null;
    }

    return { ...payload, role: session.user.role };
  } catch {
    return null;
  }
}

/**
 * Token de curta duração (5 min) emitido depois de validar a password mas
 * antes de validar o código 2FA. Não é uma sessão (não é gravado em
 * `Session`, não concede qualquer acesso) — apenas prova que o passo 1
 * (password) já foi validado para este utilizador.
 */
export async function createPendingTwoFactorToken(userId: string) {
  return new SignJWT({ sub: userId, purpose: "2fa-pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + PENDING_2FA_MAX_AGE)
    .sign(secret);
}

export async function verifyPendingTwoFactorToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "2fa-pending" || typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
