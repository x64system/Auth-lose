import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { orderSchema } from "@/lib/validators";
import { requireRole, validateCsrf } from "@/lib/security/guards";

// Seleção segura do utilizador associado a uma encomenda — nunca devolver
// passwordHash / twoFactorSecret (mesmo padrão de `licenses/route.ts`).
const safeUserSelect = { id: true, name: true, email: true, role: true } as const;

export async function GET(req: Request) {
  const auth = await requireRole("SUPPORT");
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const orders = await db.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { user: { name: { contains: query } } },
              { user: { email: { contains: query } } },
              { product: { name: { contains: query } } }
            ]
          }
        : {})
    },
    include: {
      product: true,
      user: { select: safeUserSelect },
      payments: { orderBy: { createdAt: "desc" } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const auth = await requireRole("MODERATOR");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const targetUser = await db.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
  if (!targetUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const total = parsed.data.total ?? (product.price ? Number(product.price) : 0);

  const order = await db.order.create({
    data: {
      userId: parsed.data.userId,
      productId: parsed.data.productId,
      total,
      status: "pending"
    },
    include: {
      product: true,
      user: { select: safeUserSelect },
      payments: { orderBy: { createdAt: "desc" } }
    }
  });

  await db.log.create({
    data: { action: "ORDER_CREATE", message: `Encomenda ${order.id} criada para ${product.name}`, userId: auth.session.sub }
  });

  return NextResponse.json(order, { status: 201 });
}
