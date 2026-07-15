import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { rateLimit, validateCsrf } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`2fa-setup:${session.sub}`, 5, 60_000);
  if (limited) return limited;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  // BUG FIX: Não salvar o segredo no banco até ser verificado. Retornar apenas
  // o segredo temporário para o cliente fazer o QR code, mas só persisti-lo
  // após verificação bem-sucedida no endpoint /api/auth/2fa/verify.
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(session.email, "Inject Bypass", secret);

  // Retornar o segredo sem salvar no banco ainda
  return NextResponse.json({ secret, otpauth });
}
