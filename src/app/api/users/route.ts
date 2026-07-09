import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status");
  const users = await db.user.findMany({
    where: {
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] } : {}),
      ...(status === "banned" ? { isBanned: true } : {}),
      ...(status === "active" ? { isBanned: false } : {})
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true, locale: true, theme: true }
  });
  return NextResponse.json(users);
}
