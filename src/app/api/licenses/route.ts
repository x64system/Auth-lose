import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { licenseSchema } from "@/lib/validators";

function expiresAtFromType(type: string) {
  if (type === "lifetime") return null;
  const map: Record<string, number> = { trial: 1, "1d": 1, "7d": 7, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
  const days = map[type] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") as "ACTIVE" | "INACTIVE" | "EXPIRED" | "REVOKED" | null;
  const productId = searchParams.get("productId") ?? undefined;
  const licenses = await db.license.findMany({
    where: {
      ...(query ? { code: { contains: query } } : {}),
      ...(status ? { status } : {}),
      ...(productId ? { productId } : {})
    },
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(licenses);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = licenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const code = `INJ-${crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
  const license = await db.license.create({
    data: {
      code,
      productId: parsed.data.productId,
      type: parsed.data.type,
      userId: parsed.data.userId,
      device: parsed.data.device,
      usageHistory: parsed.data.notes ?? undefined,
      status: "INACTIVE",
      expiresAt: expiresAtFromType(parsed.data.type)
    }
  });

  await db.log.create({ data: { action: "LICENSE_CREATE", message: `Key ${code} created` } });
  return NextResponse.json(license, { status: 201 });
}
