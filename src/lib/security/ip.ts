import { NextRequest } from "next/server";

/**
 * FIX CRIT-05: Extrai o IP real de forma segura.
 *
 * No Vercel, o IP real do cliente está SEMPRE no último valor de
 * X-Forwarded-For. O primeiro valor pode ser falsificado pelo cliente.
 * O header x-real-ip é definido pelo Vercel e não pode ser manipulado.
 *
 * NUNCA confiar cegamente em req.headers.get("x-forwarded-for") sem
 * extrair o último IP da cadeia — isso permite bypass de rate limit
 * ao falsificar o header com um IP diferente a cada request.
 */
export function getClientIp(req: Request | NextRequest): string {
  // x-real-ip é definido pela infraestrutura Vercel — não pode ser falsificado
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback: pegar o ÚLTIMO IP do X-Forwarded-For (definido pelo proxy mais próximo)
  // O primeiro é enviado pelo cliente e pode ser falsificado
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map(s => s.trim()).filter(Boolean);
    // O último é o mais confiável (adicionado pelo Vercel edge)
    return parts[parts.length - 1] || "unknown";
  }

  return "unknown";
}
