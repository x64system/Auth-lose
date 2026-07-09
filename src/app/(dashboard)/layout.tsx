"use client";

import { useTokenRefresh } from "@/lib/hooks/use-token-refresh";

/**
 * Layout de grupo para toda a área autenticada /(dashboard)/**.
 *
 * Responsabilidades:
 *  - Renova o JWT silenciosamente a cada 30 minutos via useTokenRefresh.
 *  - Redireciona para /login automaticamente se o token expirar ou a conta
 *    for suspensa (lógica encapsulada no hook).
 *  - Não adiciona markup extra — apenas envolve os children.
 */
export default function DashboardGroupLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Hook que dispara POST /api/auth/refresh a cada 30 min
  useTokenRefresh(30 * 60 * 1000);

  return <>{children}</>;
}
