import { Sidebar } from "@/components/sidebar";

export default function SettingsPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="card p-6">
        <h1 className="text-2xl font-semibold">Perfil & Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Alterar nome/email/password, visualizar histórico e configurar notificações em tempo real.
        </p>
      </section>
    </main>
  );
}
