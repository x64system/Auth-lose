import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validators";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const user = await db.user.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(user);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
