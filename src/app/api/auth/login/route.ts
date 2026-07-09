import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { rateLimit, validateCsrf } from "@/lib/security/guards";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`login:${ip}`, 10, 60_000);
  if (limited) return limited;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  if (user.isBanned) return NextResponse.json({ error: "User banned" }, { status: 403 });

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await createSessionToken({ sub: user.id, role: user.role, email: user.email });
  await setSessionCookie(token, parsed.data.rememberMe);

  await db.log.create({
    data: { action: "LOGIN", message: "User login successful", userId: user.id }
  });

  return NextResponse.json({ ok: true });
}
