import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  __rate_limit_store__?: Map<string, Bucket>;
};

const rateStore = globalStore.__rate_limit_store__ ?? new Map<string, Bucket>();
globalStore.__rate_limit_store__ = rateStore;

/**
 * Rate limit simples em memória.
 *
 * NOTA DE ARQUITETURA: isto funciona por instância de processo. Em
 * produção com múltiplas instâncias (serverless, vários containers) cada
 * uma tem o seu próprio contador, o que reduz a eficácia real do limite.
 * Para produção recomenda-se um store partilhado (Redis / Upstash).
 */
export function rateLimit(identifier: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = rateStore.get(identifier);
  if (!current || current.resetAt < now) {
    rateStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (current.count >= limit) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  current.count += 1;
  rateStore.set(identifier, current);
  return null;
}

// Re-exportado a partir de módulos dedicados para manter uma única
// "fachada" de segurança (`@/lib/security/guards`) sem quebrar os imports
// já existentes nas rotas.
export { validateCsrf, CSRF_COOKIE, CSRF_HEADER, readCookie } from "./csrf";
export { requireSession, requireRole, roleAtLeast, roleLevel, ROLE_HIERARCHY, type AppRole } from "./rbac";
