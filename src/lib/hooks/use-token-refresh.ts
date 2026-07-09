"use client";

import { useEffect, useRef } from "react";

/**
 * Hook que renova automaticamente o token de sessão em intervalos regulares.
 *
 * - Por padrão roda a cada 30 minutos.
 * - Chama POST /api/auth/refresh silenciosamente.
 * - Pode ser colocado no layout raiz da dashboard para proteger toda a área
 *   autenticada sem que o utilizador perceba.
 *
 * @param intervalMs  Intervalo em milissegundos (padrão: 30 min)
 */
export function useTokenRefresh(intervalMs = 30 * 60 * 1000) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) {
        // Token expirado ou conta suspensa → redireciona para login
        window.location.href = "/login";
      }
    } catch {
      // Falha de rede — ignora silenciosamente, tentará na próxima iteração
    }
  }

  useEffect(() => {
    // Dispara imediatamente ao montar para validar a sessão
    refresh();

    timerRef.current = setInterval(refresh, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs]);
}
