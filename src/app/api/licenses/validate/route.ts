import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  const { code, device } = await req.json();
  if (!code) return NextResponse.json({ valid: false, reason: "Missing code" }, { status: 400 });

  const license = await db.license.findUnique({ where: { code }, include: { product: true, user: true } });
  if (!license) return NextResponse.json({ valid: false, reason: "License not found" }, { status: 404 });
  if (license.status === "REVOKED") return NextResponse.json({ valid: false, reason: "License revoked" }, { status: 403 });
  if (license.expiresAt && license.expiresAt < new Date()) return NextResponse.json({ valid: false, reason: "License expired" }, { status: 403 });

  const shouldActivate = license.status !== "ACTIVE";
  const updated = await db.license.update({
    where: { id: license.id },
    data: {
      status: "ACTIVE",
      activatedAt: shouldActivate ? new Date() : license.activatedAt,
      device: device ?? license.device
    }
  });

  await db.log.create({
    data: {
      action: "LICENSE_VALIDATE",
      message: `Validation success for ${license.code}`,
      userId: license.userId ?? undefined
    }
  });

  return NextResponse.json({ valid: true, license: updated });
}
