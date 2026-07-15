"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, Ban, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Input } from "@/components/ui";
import { DataTable, type Column } from "@/components/data-table";
import { apiFetch, ApiError } from "@/lib/http-client";

type License = {
  id: string;
  code: string;
  type: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  ACTIVE: "text-success border-success/40",
  INACTIVE: "text-muted border-border",
  EXPIRED: "text-warning border-warning/40",
  REVOKED: "text-danger border-danger/40"
};

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("30d");

  async function createLicense(type = "30d") {
    setCreating(true);
    try {
      const created = await apiFetch<License>("/api/licenses", {
        method: "POST",
        body: JSON.stringify({ type })
      });
      toast.success(`Key "${created.code}" criada com sucesso!`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar licença");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    const initialQ = new URLSearchParams(window.location.search).get("q");
    if (initialQ) setQ(initialQ);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<License[]>(`/api/licenses${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setLicenses(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar licenças");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function updateLicense(id: string, body: Record<string, unknown>, successMessage: string) {
    try {
      await apiFetch(`/api/licenses/${id}`, { method: "PUT", body: JSON.stringify(body) });
      toast.success(successMessage);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar licença");
    }
  }

  const disable = (l: License) => updateLicense(l.id, { status: "REVOKED" }, `Key ${l.code} revogada`);
  const enable = (l: License) => updateLicense(l.id, { status: "ACTIVE" }, `Key ${l.code} ativada`);
  const renew = (l: License) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    return updateLicense(l.id, { expiresAt: expiresAt.toISOString() }, `Key ${l.code} renovada por 30 dias`);
  };

  const columns: Column<License>[] = [
    { key: "code", header: "Código", sortable: true, sortValue: (l) => l.code, render: (l) => <span className="font-mono text-xs font-medium">{l.code}</span> },
    { key: "type", header: "Tipo", sortable: true, sortValue: (l) => l.type, render: (l) => <span className="text-muted">{l.type}</span> },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      sortValue: (l) => l.status,
      render: (l) => (
        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusStyles[l.status] ?? "text-muted border-border"}`}>{l.status}</span>
      )
    },
    {
      key: "expiresAt",
      header: "Expira em",
      sortable: true,
      sortValue: (l) => (l.expiresAt ? new Date(l.expiresAt).getTime() : Infinity),
      render: (l) => <span className="text-xs text-muted">{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString("pt-PT") : "Lifetime"}</span>
    }
  ];

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sistema de Keys</h1>
              <p className="text-xs text-muted mt-0.5">Gerencie e crie licenças com múltiplos planos e durações personalizadas.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Input placeholder="Procurar key..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-56 bg-card/80 border-border" />
              
              <div className="flex items-center gap-2">
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  disabled={creating}
                  className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                >
                  <option value="1d">1 Dia (Trial)</option>
                  <option value="7d">7 Dias (Semanal)</option>
                  <option value="30d">30 Dias (Mensal)</option>
                  <option value="90d">90 Dias (Trimestral)</option>
                  <option value="180d">180 Dias (Semestral)</option>
                  <option value="365d">1 Ano (365 Dias)</option>
                  <option value="lifetime">Lifetime (Vitalício)</option>
                </select>

                <button
                  onClick={() => createLicense(selectedPlan)}
                  disabled={creating}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {creating ? "A criar..." : "+ Gerar Key"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted tracking-wider uppercase mr-1">Acesso Rápido (Planos):</span>
            <button onClick={() => createLicense("1d")} disabled={creating} className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-hover hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer">+ 1 Dia</button>
            <button onClick={() => createLicense("7d")} disabled={creating} className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-hover hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer">+ 7 Dias</button>
            <button onClick={() => createLicense("30d")} disabled={creating} className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-hover hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer">+ 30 Dias</button>
            <button onClick={() => createLicense("90d")} disabled={creating} className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-hover hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer">+ 90 Dias</button>
            <button onClick={() => createLicense("180d")} disabled={creating} className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-hover hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer">+ 180 Dias</button>
            <button onClick={() => createLicense("365d")} disabled={creating} className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-hover hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer">+ 1 Ano</button>
            <button onClick={() => createLicense("lifetime")} disabled={creating} className="rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-hover hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer">+ Lifetime</button>
          </div>
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={licenses}
              loading={loading}
              rowKey={(l) => l.id}
              emptyMessage="Nenhuma licença encontrada."
              actions={(l) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => enable(l)} className="rounded-lg border border-success/40 p-1.5 text-success transition hover:bg-success/10" title="Ativar">
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => disable(l)} className="rounded-lg border border-warning/40 p-1.5 text-warning transition hover:bg-warning/10" title="Revogar">
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => renew(l)} className="rounded-lg border border-border p-1.5 text-muted transition hover:bg-hover hover:text-foreground" title="Renovar 30 dias">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
