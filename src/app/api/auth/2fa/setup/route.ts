import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(session.email, "Inject Bypass", secret);
  await db.user.update({
    where: { id: session.sub },
    data: { twoFactorSecret: secret }
  });
  return NextResponse.json({ secret, otpauth });
}
