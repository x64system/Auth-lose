import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await req.json();
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user?.twoFactorSecret) return NextResponse.json({ error: "2FA not initialized" }, { status: 400 });
  const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
  if (!valid) return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  await db.user.update({
    where: { id: session.sub },
    data: { twoFactorEnabled: true }
  });
  return NextResponse.json({ ok: true });
}
