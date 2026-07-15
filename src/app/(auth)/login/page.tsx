"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { apiFetch, ApiError } from "@/lib/http-client";

type LoginResponse = { ok: true; role: string } | { requires2FA: true; pendingToken: string };

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [totpToken, setTotpToken] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });

      if ("requires2FA" in data && data.requires2FA) {
        setPendingToken(data.pendingToken);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingToken) return;
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/2fa/login", {
        method: "POST",
        body: JSON.stringify({ pendingToken, totpToken })
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  if (pendingToken) {
    return (
      <main className="mx-auto max-w-md px-6 py-20">
        <div className="card glass p-8">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <h1 className="text-2xl font-semibold">Verificação 2FA</h1>
          </div>
          <p className="mt-1 text-sm text-muted">Introduza o código de 6 dígitos da sua app de autenticação.</p>
          <form className="mt-6 space-y-3" onSubmit={onVerify2FA}>
            <Input
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ""))}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading || totpToken.length !== 6}>
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
            <button
              type="button"
              className="block w-full text-center text-sm text-muted hover:text-foreground"
              onClick={() => {
                setPendingToken(null);
                setTotpToken("");
                setError("");
              }}
            >
              Voltar
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <div className="card glass p-8">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-muted">Secure Authentication</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <Input
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })} />
            Remember me
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
          <Link href="/forgot-password" className="block text-center text-sm text-muted hover:text-foreground">
            Recuperar password
          </Link>
        </form>
      </div>
    </main>
  );
}
