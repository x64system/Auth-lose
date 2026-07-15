import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, issueSession } from "@/lib/auth";
import { db } from "@/lib/prisma";

/**
 * POST /api/auth/refresh
 *
 * Lê o cookie de sessão atual, verifica se ainda é válido (JWT + registo
 * ativo em `Session`), confirma que o utilizador não foi banido nem teve o
 * cargo alterado, e substitui a sessão por uma nova (novo JWT + nova
 * expiração) — a sessão antiga é revogada (removida da tabela `Session`)
 * para não acumular registos órfãos.
 *
 * O novo cookie substitui o anterior silenciosamente — o cliente não precisa
 * fazer nada além de chamar esta rota periodicamente.
 */
export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.sub) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const oldToken = cookies().get("inject_bypass_session")?.value;

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

  // BUG FIX: Deletar a sessão antiga ANTES de criar a nova para evitar conflito de token único
  if (oldToken) {
    await db.session.deleteMany({ where: { token: oldToken } }).catch(() => null);
  }

  // Re-emite o token com dados actualizados (ex.: se o role foi alterado)
  await issueSession(
    { id: user.id, email: user.email, role: user.role },
    { ip: req.headers.get("x-forwarded-for"), userAgent: req.headers.get("user-agent") }
  );

  return NextResponse.json({ ok: true, role: user.role });
}
