import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireRole, validateCsrf } from "@/lib/security/guards";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("MODERATOR");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const allowedStatus = ["ACTIVE", "INACTIVE", "EXPIRED", "REVOKED"];
  if (body?.status && !allowedStatus.includes(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  // BUG FIX #16: Validar data de expiração
  let validatedExpiresAt: Date | undefined;
  if (body?.expiresAt) {
    validatedExpiresAt = new Date(body.expiresAt);
    if (isNaN(validatedExpiresAt.getTime())) {
      return NextResponse.json({ error: "Data de expiração inválida" }, { status: 400 });
    }
    // Permitir datas no passado apenas para status EXPIRED
    if (validatedExpiresAt < new Date() && body?.status !== "EXPIRED") {
      return NextResponse.json({ error: "Data de expiração deve ser no futuro (ou defina status como EXPIRED)" }, { status: 400 });
    }
  }

  const license = await db.license.update({
    where: { id: params.id },
    data: {
      status: body?.status,
      expiresAt: validatedExpiresAt
    }
  });

  await db.log.create({
    data: { action: "LICENSE_UPDATE", message: `Key ${license.code} atualizada`, userId: auth.session.sub }
  });

  return NextResponse.json(license);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("MODERATOR");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const license = await db.license.delete({ where: { id: params.id } });

  await db.log.create({
    data: { action: "LICENSE_DELETE", message: `Key ${license.code} eliminada`, userId: auth.session.sub }
  });

  return NextResponse.json({ ok: true });
}
