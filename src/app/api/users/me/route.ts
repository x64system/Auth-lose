import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { selfProfileUpdateSchema } from "@/lib/validators";
import { requireSession, validateCsrf } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const user = await db.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locale: true,
      theme: true,
      avatarUrl: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = selfProfileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const user = await db.user.update({
    where: { id: auth.session.sub },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, locale: true, theme: true }
  });

  return NextResponse.json(user);
}
