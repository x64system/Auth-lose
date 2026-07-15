"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { apiFetch, ApiError } from "@/lib/http-client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form)
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <div className="card glass p-8">
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="mt-1 text-sm text-muted">Trusted by Developers</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <Input placeholder="Nome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
          <p className="text-xs text-muted">Mínimo 8 caracteres, com maiúscula, minúscula e número.</p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Criar conta"}
          </Button>
          <Link href="/login" className="block text-center text-sm text-muted hover:text-foreground">
            Já tem conta? Entrar
          </Link>
        </form>
      </div>
    </main>
  );
}
