"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": "inject-bypass-client" },
      body: JSON.stringify(form)
    });
    if (!res.ok) return setError("Credenciais inválidas");
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <div className="card glass p-8">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-muted">Secure Authentication</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <Input placeholder="Email" type="text" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input
            placeholder="Password"
            type="password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })} />
            Remember me
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
          <Link href="/forgot-password" className="block text-center text-sm text-muted">
            Recuperar password
          </Link>
        </form>
      </div>
    </main>
  );
}
