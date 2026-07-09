import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  clearSessionCookie();

  if (session?.sub) {
    await db.log.create({
      data: { action: "LOGOUT", message: "User logout", userId: session.sub }
    });
  }

  return NextResponse.json({ ok: true });
}
