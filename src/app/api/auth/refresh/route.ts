import { NextResponse } from "next/server";
import { getSession, createSessionToken, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/prisma";

/**
 * POST /api/auth/refresh
 *
 * Lê o cookie de sessão atual, verifica se ainda é válido, busca o utilizador
 * no banco para garantir que não foi banido nem teve o cargo alterado,
 * e re-emite um novo token JWT com expiração renovada.
 *
 * O novo cookie substitui o anterior silenciosamente — o cliente não precisa
 * fazer nada além de chamar esta rota periodicamente.
 */
export async function POST() {
  const session = await getSession();

  if (!session?.sub) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Busca o estado atual do utilizador no banco
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, role: true, isBanned: true }
  });

  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 401 });
  }

  if (user.isBanned) {
    return NextResponse.json({ error: "Conta suspensa" }, { status: 403 });
  }

  // Re-emite o token com dados actualizados (ex.: se o role foi alterado)
  const newToken = await createSessionToken({
    sub: user.id,
    role: user.role,
    email: user.email
  });

  await setSessionCookie(newToken);

  return NextResponse.json({ ok: true, role: user.role });
}
