import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { licenseSchema } from "@/lib/validators";
import { requireRole, validateCsrf } from "@/lib/security/guards";

function expiresAtFromType(type: string) {
  if (type === "lifetime") return null;
  const map: Record<string, number> = { trial: 1, "1d": 1, "7d": 7, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
  const days = map[type] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// Seleção segura do utilizador associado a uma licença — nunca devolver
// passwordHash / twoFactorSecret (ver include:{user:true} do bug original).
const safeUserSelect = { id: true, name: true, email: true, role: true } as const;

export async function GET(req: Request) {
  const auth = await requireRole("SUPPORT");
  if (auth.response) return auth.response;

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
    include: { product: true, user: { select: safeUserSelect } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(licenses);
}

export async function POST(req: Request) {
  const auth = await requireRole("MODERATOR");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = licenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  let targetProductId = parsed.data.productId;
  if (!targetProductId) {
    const defaultProd = await db.product.findFirst({ where: { status: "active" } }) ?? await db.product.findFirst();
    if (defaultProd) {
      targetProductId = defaultProd.id;
    } else {
      const newProd = await db.product.create({
        data: { name: "Inject Core", description: "Default Core Loader", version: "1.0.0", category: "Loader", status: "active" }
      });
      targetProductId = newProd.id;
    }
  }

  const code = `INJ-${crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
  const license = await db.license.create({
    data: {
      code,
      productId: targetProductId,
      type: parsed.data.type,
      userId: parsed.data.userId,
      device: parsed.data.device,
      usageHistory: parsed.data.notes ? JSON.stringify({ notes: parsed.data.notes }) : null,
      status: "ACTIVE",
      expiresAt: expiresAtFromType(parsed.data.type)
    }
  });

  await db.log.create({
    data: { action: "LICENSE_CREATE", message: `Key ${code} created`, userId: auth.session.sub }
  });
  return NextResponse.json(license, { status: 201 });
}
