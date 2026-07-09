import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const products = await db.product.findMany({
    where: {
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] } : {}),
      ...(status ? { status } : {}),
      ...(category ? { category } : {})
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const product = await db.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
