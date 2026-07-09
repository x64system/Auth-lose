import { DashboardCards } from "@/components/dashboard-cards";
import { Sidebar } from "@/components/sidebar";
import { StatsChart } from "@/components/charts";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardPage() {
  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <div className="space-y-6">
        <Topbar />
        <header>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted">Manage Everything From One Dashboard</p>
        </header>
        <DashboardCards />
        <StatsChart />
        <section className="card glass p-5">
          <h2 className="font-medium">Últimos acessos e logs</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>admin@injectbypass.io iniciou sessão</li>
            <li>Licença TRIAL criada para Produto LoaderX</li>
            <li>Key revogada por política de fraude</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
