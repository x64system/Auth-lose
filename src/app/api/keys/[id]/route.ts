import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireSession, roleAtLeast, validateCsrf } from "@/lib/security/guards";

/**
 * Mascara uma API key para nunca expor o valor completo fora do momento da
 * criação: mantém os primeiros 6 e os últimos 4 caracteres, o resto é
 * substituído por "...".
 */
function maskKey(key: string): string {
  if (key.length <= 10) return `${key.slice(0, 3)}...`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  if (body?.revoked !== true) {
    return NextResponse.json({ error: "Payload inválido: esperado { revoked: true }" }, { status: 400 });
  }

  const existing = await db.apiKey.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "API key não encontrada" }, { status: 404 });

  // Só o dono da key ou staff (MODERATOR+) pode revogá-la.
  const isOwner = existing.userId === auth.session.sub;
  if (!isOwner && !roleAtLeast(auth.session.role, "MODERATOR")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const apiKey = await db.apiKey.update({ where: { id: params.id }, data: { revoked: true } });

  await db.log.create({
    data: { action: "API_KEY_REVOKE", message: `API key "${apiKey.name}" revogada`, userId: auth.session.sub }
  });

  return NextResponse.json({ ...apiKey, key: maskKey(apiKey.key) });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const existing = await db.apiKey.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "API key não encontrada" }, { status: 404 });

  // Só o dono da key ou ADMIN+ pode eliminá-la.
  const isOwner = existing.userId === auth.session.sub;
  if (!isOwner && !roleAtLeast(auth.session.role, "ADMIN")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const deleted = await db.apiKey.delete({ where: { id: params.id } });

  await db.log.create({
    data: { action: "API_KEY_DELETE", message: `API key "${deleted.name}" eliminada`, userId: auth.session.sub }
  });

  return NextResponse.json({ ok: true });
}
