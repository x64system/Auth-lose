import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await db.log.findMany({
    take: 100,
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(logs);
}
