import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const product = await db.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
