import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";
import { requireRole, validateCsrf } from "@/lib/security/guards";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("DEVELOPER");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const product = await db.product.update({ where: { id: params.id }, data: parsed.data });

  await db.log.create({
    data: { action: "PRODUCT_UPDATE", message: `Produto ${product.name} atualizado`, userId: auth.session.sub }
  });

  return NextResponse.json(product);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("DEVELOPER");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const product = await db.product.delete({ where: { id: params.id } });

  await db.log.create({
    data: { action: "PRODUCT_DELETE", message: `Produto ${product.name} eliminado`, userId: auth.session.sub }
  });

  return NextResponse.json({ ok: true });
}
