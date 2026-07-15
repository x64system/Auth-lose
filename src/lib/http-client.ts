"use client";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Wrapper de `fetch` para chamadas ao nosso próprio backend:
 *  - Anexa automaticamente o header CSRF (double submit cookie) em toda
 *    mutação — substitui o antigo `"x-csrf-token": "inject-bypass-client"`
 *    hardcoded, que não validava nada.
 *  - Define `Content-Type: application/json` por padrão.
 *  - Lança `ApiError` com a mensagem devolvida pela API em caso de erro,
 *    para os componentes poderem mostrar feedback real ao utilizador.
 */
export async function apiFetch<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (method !== "GET" && method !== "HEAD") {
    const csrfToken = readCsrfToken();
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken);
  }

  const res = await fetch(url, { ...init, headers, credentials: "same-origin" });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (data && typeof data === "object" && "error" in data && String(data.error)) || res.statusText;
    throw new ApiError(message, res.status);
  }

  return data as T;
}
