import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth.response) return auth.response;

  const logs = await db.log.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  return NextResponse.json(logs);
}
