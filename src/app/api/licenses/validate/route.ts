import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/guards";

/**
 * POST /api/licenses/validate
 *
 * Endpoint público por design — é chamado pelo software distribuído aos
 * clientes finais (não por um utilizador autenticado no dashboard), por
 * isso não exige sessão. Em compensação:
 *  - tem rate limit por IP (impede brute-force de códigos de licença);
 *  - nunca devolve dados sensíveis do utilizador associado (sem
 *    passwordHash / twoFactorSecret — ver bug original de vazamento).
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`license-validate:${ip}`, 30, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const device = typeof body?.device === "string" ? body.device : undefined;
  if (!code) return NextResponse.json({ valid: false, reason: "Missing code" }, { status: 400 });

  const license = await db.license.findUnique({
    where: { code },
    include: { product: true, user: { select: { id: true, name: true } } }
  });
  if (!license) return NextResponse.json({ valid: false, reason: "License not found" }, { status: 404 });
  if (license.status === "REVOKED") return NextResponse.json({ valid: false, reason: "License revoked" }, { status: 403 });
  if (license.expiresAt && license.expiresAt < new Date()) return NextResponse.json({ valid: false, reason: "License expired" }, { status: 403 });

  // BUG FIX: Validar HWID/device binding se a licença já tiver um dispositivo
  // registrado e o novo dispositivo for diferente. Isso previne compartilhamento
  // de chaves entre múltiplos dispositivos.
  if (license.device && device && license.device !== device) {
    await db.log.create({
      data: {
        action: "LICENSE_DEVICE_MISMATCH",
        message: `Device mismatch for license ${license.code}: expected ${license.device}, got ${device}`,
        userId: license.userId ?? undefined,
        ip
      }
    });
    return NextResponse.json({ valid: false, reason: "License bound to different device" }, { status: 403 });
  }

  const shouldActivate = license.status !== "ACTIVE";
  const updated = await db.license.update({
    where: { id: license.id },
    data: {
      status: "ACTIVE",
      activatedAt: shouldActivate ? new Date() : license.activatedAt,
      device: device ?? license.device
    },
    include: { product: true, user: { select: { id: true, name: true } } }
  });

  await db.log.create({
    data: {
      action: "LICENSE_VALIDATE",
      message: `Validation success for ${license.code}`,
      userId: license.userId ?? undefined,
      ip
    }
  });

  return NextResponse.json({ valid: true, license: updated });
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
