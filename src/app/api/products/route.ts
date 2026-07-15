import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";
import { requireRole, validateCsrf } from "@/lib/security/guards";

export async function GET(req: Request) {
  const auth = await requireRole("SUPPORT");
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const products = await db.product.findMany({
    where: {
      ...(query ? { OR: [{ name: { contains: query } }, { description: { contains: query } }] } : {}),
      ...(status ? { status } : {}),
      ...(category ? { category } : {})
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const auth = await requireRole("DEVELOPER");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const product = await db.product.create({ data: parsed.data });

  await db.log.create({
    data: { action: "PRODUCT_CREATE", message: `Produto ${product.name} criado`, userId: auth.session.sub }
  });

  return NextResponse.json(product, { status: 201 });
}
