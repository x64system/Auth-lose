import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { StatsChart } from "@/components/charts";

export default function AnalyticsPage() {
  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="space-y-4">
          <div className="card glass p-6">
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="mt-1 text-sm text-muted">
              Utilizadores ativos, ativações, licenças expiradas, downloads e receita.
            </p>
          </div>
          <StatsChart />
        </div>
      </section>
    </main>
  );
}
