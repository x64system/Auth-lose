"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { DataTable, type Column } from "@/components/data-table";
import { apiFetch, ApiError } from "@/lib/http-client";

type LogEntry = {
  id: string;
  action: string;
  message: string;
  ip: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    apiFetch<LogEntry[]>("/api/logs")
      .then(setLogs)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
        } else {
          toast.error(err instanceof ApiError ? err.message : "Erro ao carregar logs");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<LogEntry>[] = [
    { key: "action", header: "Ação", sortable: true, sortValue: (l) => l.action, render: (l) => <span className="font-medium">{l.action}</span> },
    { key: "message", header: "Mensagem", render: (l) => <span className="text-muted">{l.message}</span> },
    { key: "user", header: "Utilizador", sortable: true, sortValue: (l) => l.user?.email ?? "", render: (l) => <span className="text-muted">{l.user?.email ?? "—"}</span> },
    { key: "ip", header: "IP", render: (l) => <span className="text-muted">{l.ip ?? "—"}</span> },
    {
      key: "createdAt",
      header: "Data",
      sortable: true,
      sortValue: (l) => new Date(l.createdAt).getTime(),
      render: (l) => <span className="whitespace-nowrap text-xs text-muted">{new Date(l.createdAt).toLocaleString("pt-PT")}</span>
    }
  ];

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="card p-6">
        <Topbar />
        <h1 className="text-2xl font-semibold">Logs & Auditoria</h1>
        <p className="mt-1 text-sm text-muted">
          Eventos: login, logout, ativação, expiração, criação/eliminação de keys, alterações e erros.
        </p>

        {forbidden ? (
          <p className="mt-4 text-sm text-danger">O seu cargo não tem acesso à trilha de auditoria (requer ADMIN+).</p>
        ) : (
          <div className="mt-4">
            <DataTable columns={columns} data={logs} loading={loading} rowKey={(l) => l.id} emptyMessage="Sem eventos registados." pageSize={10} />
          </div>
        )}
      </section>
    </main>
  );
}
