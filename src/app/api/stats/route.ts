import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [totalKeys, activeKeys, expiredKeys, users, products] = await Promise.all([
    db.license.count(),
    db.license.count({ where: { status: "ACTIVE" } }),
    db.license.count({ where: { status: "EXPIRED" } }),
    db.user.count(),
    db.product.count()
  ]);

  return NextResponse.json({ totalKeys, activeKeys, expiredKeys, users, products });
}
