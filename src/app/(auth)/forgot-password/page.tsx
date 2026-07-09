"use client";

import { Button, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <div className="card glass p-8">
        <h1 className="text-2xl font-semibold">Recuperar Password</h1>
        <p className="mt-1 text-sm text-muted">Verificação por email (stub pronto para integração SMTP)</p>
        <form className="mt-6 space-y-3">
          <Input type="email" placeholder="Digite o seu email" />
          <Button type="submit" className="w-full">
            Enviar link de recuperação
          </Button>
        </form>
      </div>
    </main>
  );
}
