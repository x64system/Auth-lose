import Link from "next/link";
import { ShieldCheck, KeyRound, LayoutDashboard, Star } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui";

const slogans = [
  "Professional Software Licensing",
  "Secure Authentication",
  "Fast & Reliable",
  "Trusted by Developers",
  "Manage Everything From One Dashboard",
  "Modern Licensing Infrastructure"
];

export default function HomePage() {
  return (
    <main className="bg-bg">
      <Navbar />
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-muted">
            Secure Licensing Platform
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Inject Bypass</h1>
          <p className="max-w-xl text-muted">
            Modern Licensing Platform for Professional Software Distribution.
          </p>
          <div className="flex gap-3">
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-card text-foreground hover:bg-hover">Dashboard Demo</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-muted">
            {slogans.map((s) => (
              <div key={s} className="card glass p-3">
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="card glass p-8">
          <h2 className="text-xl font-medium">Estatísticas</h2>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              ["4.2K", "Keys ativas"],
              ["99.98%", "Uptime"],
              ["160+", "Produtos"],
              ["24/7", "Auditoria"]
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-border bg-card p-4">
                <p className="text-2xl font-semibold">{v}</p>
                <p className="text-sm text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-12">
        <h3 className="text-2xl font-semibold">Features</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card glass p-6">
            <ShieldCheck className="mb-3 h-5 w-5" />
            <p className="font-medium">Secure Authentication</p>
          </div>
          <div className="card glass p-6">
            <KeyRound className="mb-3 h-5 w-5" />
            <p className="font-medium">Advanced Key System</p>
          </div>
          <div className="card glass p-6">
            <LayoutDashboard className="mb-3 h-5 w-5" />
            <p className="font-medium">Modern Admin Dashboard</p>
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-6 py-12">
        <h3 className="text-2xl font-semibold">Planos</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Starter", "Pro", "Enterprise"].map((plan) => (
            <div key={plan} className="card glass p-6">
              <p className="text-lg font-medium">{plan}</p>
              <p className="mt-2 text-sm text-muted">Licenciamento profissional com segurança avançada.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h3 className="text-2xl font-semibold">Testemunhos</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Startup A", "Studio B", "Dev Team C"].map((company) => (
            <div key={company} className="card glass p-6">
              <div className="mb-2 flex gap-1 text-light">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <p className="text-sm text-muted">Infraestrutura moderna, estável e segura para distribuição de software.</p>
              <p className="mt-3 text-sm font-medium">{company}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-6 py-12">
        <h3 className="text-2xl font-semibold">FAQ</h3>
        <div className="mt-6 space-y-3">
          <div className="card glass p-5">Como funciona a validação de licença? Via API REST autenticada.</div>
          <div className="card glass p-5">Posso revogar keys? Sim, instantaneamente no painel.</div>
          <div className="card glass p-5">Existe auditoria? Sim, logs completos de segurança.</div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} Inject Bypass — Secure Licensing Platform
      </footer>
    </main>
  );
}
