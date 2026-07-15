import { NextResponse } from "next/server";
import { requireRole } from "@/lib/security/guards";

/**
 * GET /api/debug-db
 *
 * Endpoint removido por razões de segurança.
 * Expunha todos os códigos de licença e informações da base de dados
 * sem autenticação (CRIT-01 — Bug Bounty 2026-07-15).
 */
export async function GET() {
  const auth = await requireRole("SUPER_ADMIN");
  if (auth.response) return auth.response;

  // Endpoint desativado em produção — retorna 410 Gone
  return NextResponse.json(
    { error: "Este endpoint foi desativado por razões de segurança." },
    { status: 410 }
  );
}

