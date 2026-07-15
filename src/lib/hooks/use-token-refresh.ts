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
  const isRefreshingRef = useRef(false);

  async function refresh() {
    // BUG FIX: Prevenir múltiplas chamadas simultâneas
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const res = await fetch("/api/auth/refresh", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        // Token expirado ou conta suspensa → redireciona para login
        console.warn('[Token Refresh] Failed, redirecting to login');
        window.location.href = "/login";
      }
    } catch (err) {
      // Falha de rede — ignora silenciosamente, tentará na próxima iteração
      console.warn('[Token Refresh] Network error, will retry later', err);
    } finally {
      isRefreshingRef.current = false;
    }
  }

  useEffect(() => {
    // BUG FIX: NÃO dispara imediatamente - deixa o usuário logar primeiro
    // Apenas agenda o próximo refresh
    timerRef.current = setInterval(refresh, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // BUG FIX: Array vazio para não recriar o interval
}
