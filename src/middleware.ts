import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { resolveJwtSecretBytes } from "@/lib/security/jwt-secret";
import { CSRF_COOKIE } from "@/lib/security/csrf";

const secret = resolveJwtSecretBytes();
const SESSION_COOKIE = "inject_bypass_session";

async function hasValidSessionCookie(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Middleware global:
 *
 * 1. Garante que todo o browser tem um cookie `csrf_token` legível por JS,
 *    usado no padrão "double submit cookie" (ver `@/lib/security/csrf`).
 * 2. Protege as páginas de `/dashboard/**` no servidor — antes disto a
 *    "proteção" era só um hook client-side, ou seja, inexistente para
 *    quem desativasse JS ou acedesse a rota diretamente. Nota: isto é uma
 *    verificação otimista (só a assinatura/expiração do JWT, sem consultar
 *    a tabela `Session`, porque o runtime Edge não suporta Prisma) — a
 *    verificação autoritativa continua a acontecer em cada Route Handler
 *    via `getSession()`.
 * 3. Redireciona utilizadores já autenticados para fora de /login e
 *    /register.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = await hasValidSessionCookie(sessionToken);

  // Proteger rotas do dashboard
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return withCsrfCookie(req, NextResponse.redirect(loginUrl));
  }

  // BUG FIX: Não redirecionar automaticamente de login/register se já estiver autenticado
  // Isso permite que o usuário faça logout e volte para login sem problemas
  // O redirecionamento será feito após o login bem-sucedido no próprio componente
  // if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
  //   return withCsrfCookie(req, NextResponse.redirect(new URL("/dashboard", req.url)));
  // }

  return withCsrfCookie(req, NextResponse.next());
}

function withCsrfCookie(req: NextRequest, res: NextResponse) {
  if (!req.cookies.get(CSRF_COOKIE)) {
    res.cookies.set(CSRF_COOKIE, crypto.randomUUID(), {
      httpOnly: false,
      sameSite: "strict", // FIX MED-04: strict evita envio em navega\u00e7\u00f5es cross-site
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)"]
};
