import { NextResponse } from "next/server";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

/**
 * Lê um cookie específico a partir do header `Cookie` bruto de um `Request`.
 * Implementado manualmente (em vez de `next/headers`) para poder ser usado
 * tanto em Route Handlers como no `middleware.ts` (runtime edge).
 */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * Validação CSRF via "double submit cookie": o middleware garante que todo
 * o browser recebe um cookie `csrf_token` legível por JS. O cliente lê esse
 * cookie e reenvia o mesmo valor no header `x-csrf-token` em toda mutação.
 *
 * Um atacante cross-site não consegue ler o cookie da vítima (same-origin
 * policy), por isso não consegue construir um pedido forjado com o header
 * correto — mesmo que o cookie seja automaticamente anexado pelo browser.
 */
export function validateCsrf(req: Request): NextResponse | null {
  const header = req.headers.get(CSRF_HEADER);
  const cookie = readCookie(req, CSRF_COOKIE);
  if (!header || !cookie || header !== cookie) {
    return NextResponse.json({ error: "Token CSRF inválido ou ausente" }, { status: 403 });
  }
  return null;
}
