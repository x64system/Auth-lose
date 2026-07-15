import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole("SUPPORT");
  if (auth.response) return auth.response;

  const [totalKeys, activeKeys, expiredKeys, users, products, orders, revenue] = await Promise.all([
    db.license.count(),
    db.license.count({ where: { status: "ACTIVE" } }),
    db.license.count({ where: { status: "EXPIRED" } }),
    db.user.count(),
    db.product.count(),
    db.order.count(),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "completed" } })
  ]);

  return NextResponse.json({
    totalKeys,
    activeKeys,
    expiredKeys,
    users,
    products,
    orders,
    revenue: revenue._sum.amount ?? 0
  });
}
