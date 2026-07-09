import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const license = await db.license.update({
    where: { id: params.id },
    data: {
      status: body.status,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
    }
  });
  return NextResponse.json(license);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.license.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
