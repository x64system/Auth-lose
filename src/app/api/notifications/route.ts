import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireSession, roleAtLeast } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  // Staff (MODERATOR+) vê as notificações de todos; outros utilizadores só
  // veem as suas próprias (evita o IDOR original, que devolvia tudo a
  // qualquer pessoa autenticada ou não).
  const isStaff = roleAtLeast(auth.session.role, "MODERATOR");

  const notifications = await db.notification.findMany({
    where: isStaff ? {} : { userId: auth.session.sub },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json(notifications);
}
