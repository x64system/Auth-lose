import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function NotificationsPage() {
  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Nova licença criada para Inject Core.</li>
            <li>Licença expirada para user@domain.com.</li>
            <li>Atualização crítica disponível.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
