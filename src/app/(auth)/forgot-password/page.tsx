"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { apiFetch, ApiError } from "@/lib/http-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await apiFetch<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível processar o pedido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <div className="card glass p-8">
        <h1 className="text-2xl font-semibold">Recuperar Password</h1>
        <p className="mt-1 text-sm text-muted">Verificação por email (stub pronto para integração SMTP)</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <Input type="email" placeholder="Digite o seu email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {message ? <p className="text-sm text-success">{message}</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
          </Button>
        </form>
      </div>
    </main>
  );
}
