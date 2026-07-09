import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function ApiPage() {
  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">API Management</h1>
          <p className="mt-1 text-sm text-muted">Gestão de API Keys, limites de requests e documentação Swagger.</p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-bg p-3 text-xs text-muted">
            {`GET /api/stats\nPOST /api/licenses/validate\nGET /api/users`}
          </pre>
        </div>
      </section>
    </main>
  );
}
