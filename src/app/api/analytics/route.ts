import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole("SUPPORT");
  if (auth.response) return auth.response;

  const [newUsers, activeLicenses, expiredLicenses, downloads] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) } } }),
    db.license.count({ where: { status: "ACTIVE" } }),
    db.license.count({ where: { status: "EXPIRED" } }),
    db.product.aggregate({ _sum: { downloads: true } })
  ]);

  return NextResponse.json({
    activeUsers: newUsers,
    newUsers,
    activations: activeLicenses,
    expiredLicenses,
    downloads: downloads._sum.downloads ?? 0
  });
}
