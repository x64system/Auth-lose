import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/prisma";
import { apiKeySchema } from "@/lib/validators";
import { requireSession, roleAtLeast, validateCsrf } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

const safeUserSelect = { id: true, name: true, email: true } as const;

/**
 * Mascara uma API key para nunca expor o valor completo fora do momento da
 * criação (POST): mantém os primeiros 6 e os últimos 4 caracteres, o resto
 * é substituído por "...". Usado em todos os GETs desta rota e também no
 * PUT de revogação.
 */
function maskKey(key: string): string {
  if (key.length <= 10) return `${key.slice(0, 3)}...`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  // Staff (MODERATOR+) vê as API keys de todos os utilizadores, para fins
  // de auditoria/suporte; qualquer outro utilizador só vê as suas próprias.
  const isStaff = roleAtLeast(auth.session.role, "MODERATOR");

  if (isStaff) {
    const keys = await db.apiKey.findMany({
      include: { user: { select: safeUserSelect } },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(keys.map((k) => ({ ...k, key: maskKey(k.key) })));
  }

  const keys = await db.apiKey.findMany({
    where: { userId: auth.session.sub },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(keys.map((k) => ({ ...k, key: maskKey(k.key) })));
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = apiKeySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const key = `ib_${randomBytes(20).toString("hex")}`;
  const apiKey = await db.apiKey.create({
    data: { key, name: parsed.data.name, userId: auth.session.sub }
  });

  await db.log.create({
    data: { action: "API_KEY_CREATE", message: `API key "${apiKey.name}" criada`, userId: auth.session.sub }
  });

  // Única resposta de toda a API onde `key` vem com o valor completo — o
  // frontend deve mostrar isto uma única vez (modal) e nunca mais o
  // conseguirá obter depois desta resposta.
  return NextResponse.json(
    { id: apiKey.id, name: apiKey.name, key: apiKey.key, createdAt: apiKey.createdAt },
    { status: 201 }
  );
}
