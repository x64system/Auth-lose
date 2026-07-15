import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

/**
 * Hierarquia de cargos: índice maior = mais permissões.
 * Espelha `apps/api/src/modules/auth/roles.guard.ts` para manter as duas
 * camadas de backend consistentes.
 */
export const ROLE_HIERARCHY = [
  "USER",
  "CUSTOMER",
  "SUPPORT",
  "DEVELOPER",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN"
] as const;

export type AppRole = (typeof ROLE_HIERARCHY)[number];

export function roleLevel(role: string): number {
  const idx = ROLE_HIERARCHY.indexOf(role as AppRole);
  return idx === -1 ? -1 : idx;
}

export function roleAtLeast(role: string, minRole: AppRole): boolean {
  return roleLevel(role) >= roleLevel(minRole);
}

type GuardFailure = { session: null; response: NextResponse };
type GuardSuccess = { session: SessionPayload; response: null };
export type GuardResult = GuardFailure | GuardSuccess;

function unauthorized(message = "Não autenticado") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Acesso negado") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Garante que existe uma sessão válida (cookie JWT + registo ativo na
 * tabela Session). Uso:
 *
 * const auth = await requireSession();
 * if (auth.response) return auth.response;
 * // auth.session está disponível e tipado a partir daqui
 */
export async function requireSession(): Promise<GuardResult> {
  const session = await getSession();
  if (!session) return { session: null, response: unauthorized() };
  return { session, response: null };
}

/**
 * Garante sessão válida E cargo mínimo (respeitando a hierarquia acima).
 */
export async function requireRole(minRole: AppRole): Promise<GuardResult> {
  const auth = await requireSession();
  if (auth.response) return auth;
  if (!roleAtLeast(auth.session.role, minRole)) {
    return {
      session: null,
      response: forbidden(`Acesso negado: requer cargo ${minRole} ou superior`)
    };
  }
  return auth;
}
