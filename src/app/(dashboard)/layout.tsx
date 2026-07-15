"use client";

import { useTokenRefresh } from "@/lib/hooks/use-token-refresh";
import { CommandPaletteProvider } from "@/components/command-palette";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { PageTransition } from "@/components/page-transition";

/**
 * Layout de grupo para toda a área autenticada /(dashboard)/**.
 *
 * Responsabilidades:
 *  - Renova o JWT silenciosamente a cada 30 minutos via useTokenRefresh.
 *  - Redireciona para /login automaticamente se o token expirar ou a conta
 *    for suspensa (lógica encapsulada no hook). A proteção autoritativa
 *    fica no `middleware.ts` (servidor) — isto é só UX.
 *  - Disponibiliza o Command Palette (⌘K) e o diálogo de confirmação a
 *    toda a área autenticada.
 */
export default function DashboardGroupLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Hook que dispara POST /api/auth/refresh a cada 30 min
  useTokenRefresh(30 * 60 * 1000);

  return (
    <ConfirmDialogProvider>
      <CommandPaletteProvider>
        <PageTransition>{children}</PageTransition>
      </CommandPaletteProvider>
    </ConfirmDialogProvider>
  );
}
