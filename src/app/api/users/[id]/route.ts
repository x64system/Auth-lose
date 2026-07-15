import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validators";
import { requireRole, roleLevel } from "@/lib/security/guards";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Ninguém pode atribuir um cargo com mais permissões do que o seu próprio
  // (impede escalada de privilégios, ex.: um ADMIN a promover alguém a
  // SUPER_ADMIN).
  if (parsed.data.role && roleLevel(parsed.data.role) > roleLevel(auth.session.role)) {
    return NextResponse.json(
      { error: `Não pode atribuir um cargo (${parsed.data.role}) superior ao seu próprio (${auth.session.role})` },
      { status: 403 }
    );
  }

  const target = await db.user.findUnique({ where: { id: params.id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  if (parsed.data.isBanned === true && params.id === auth.session.sub) {
    return NextResponse.json({ error: "Não pode banir a sua própria conta" }, { status: 400 });
  }

  // Também impede editar/despromover alguém com cargo atual superior ao do chamador.
  if (roleLevel(target.role) > roleLevel(auth.session.role)) {
    return NextResponse.json({ error: "Não pode editar um utilizador com cargo superior ao seu" }, { status: 403 });
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true, locale: true, theme: true }
  });

  if (parsed.data.isBanned !== undefined || parsed.data.role !== undefined) {
    await db.session.deleteMany({ where: { userId: params.id } }).catch(() => null);
  }

  await db.log.create({
    data: { action: "USER_UPDATE", message: `Utilizador ${user.email} atualizado`, userId: auth.session.sub }
  });

  return NextResponse.json(user);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth.response) return auth.response;

  if (params.id === auth.session.sub) {
    return NextResponse.json({ error: "Não pode eliminar a sua própria conta" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: params.id }, select: { role: true, email: true } });
  if (!target) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
  if (roleLevel(target.role) > roleLevel(auth.session.role)) {
    return NextResponse.json({ error: "Não pode eliminar um utilizador com cargo superior ao seu" }, { status: 403 });
  }

  await db.user.delete({ where: { id: params.id } });

  await db.log.create({
    data: { action: "USER_DELETE", message: `Utilizador ${target.email} eliminado`, userId: auth.session.sub }
  });

  return NextResponse.json({ ok: true });
}
