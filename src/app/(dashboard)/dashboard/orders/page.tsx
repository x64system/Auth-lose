"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Ban, RotateCcw } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Input } from "@/components/ui";
import { DataTable, type Column } from "@/components/data-table";
import { apiFetch, ApiError } from "@/lib/http-client";
import { useConfirm } from "@/components/confirm-dialog";

type OrderPayment = {
  id: string;
  gateway: string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
};

type Order = {
  id: string;
  total: number | string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string };
  payments: OrderPayment[];
};

const statusStyles: Record<string, string> = {
  pending: "text-warning border-warning/40",
  paid: "text-success border-success/40",
  cancelled: "text-danger border-danger/40",
  refunded: "text-danger border-danger/40"
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  cancelled: "Cancelada",
  refunded: "Reembolsada"
};

const paymentStatusStyles: Record<string, string> = {
  completed: "text-success",
  refunded: "text-danger",
  pending: "text-warning",
  failed: "text-danger"
};

const paymentStatusLabels: Record<string, string> = {
  completed: "Concluído",
  refunded: "Reembolsado",
  pending: "Pendente",
  failed: "Falhou"
};

export default function OrdersPage() {
  const confirm = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialQ = new URLSearchParams(window.location.search).get("q");
    if (initialQ) setQ(initialQ);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Order[]>(`/api/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setOrders(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function updateStatus(order: Order, status: string, successMessage: string) {
    try {
      await apiFetch(`/api/orders/${order.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success(successMessage);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar encomenda");
    }
  }

  const markAsPaid = (order: Order) => updateStatus(order, "paid", `Encomenda de ${order.user.name} marcada como paga`);

  async function cancelOrder(order: Order) {
    const ok = await confirm({
      title: "Cancelar encomenda",
      description: `Tem a certeza que deseja cancelar a encomenda de "${order.user.name}" (${order.product.name})? Esta ação não pode ser desfeita.`,
      confirmLabel: "Cancelar encomenda",
      danger: true
    });
    if (!ok) return;
    updateStatus(order, "cancelled", "Encomenda cancelada");
  }

  async function refundOrder(order: Order) {
    const ok = await confirm({
      title: "Reembolsar encomenda",
      description: `Tem a certeza que deseja reembolsar a encomenda de "${order.user.name}" (${order.product.name})? O pagamento associado será marcado como reembolsado.`,
      confirmLabel: "Reembolsar",
      danger: true
    });
    if (!ok) return;
    updateStatus(order, "refunded", "Encomenda reembolsada");
  }

  const columns: Column<Order>[] = [
    {
      key: "user",
      header: "Cliente",
      sortable: true,
      sortValue: (o) => o.user.name.toLowerCase(),
      render: (o) => (
        <div className="flex flex-col">
          <span className="font-medium">{o.user.name}</span>
          <span className="text-xs text-muted">{o.user.email}</span>
        </div>
      )
    },
    {
      key: "product",
      header: "Produto",
      sortable: true,
      sortValue: (o) => o.product.name.toLowerCase(),
      render: (o) => <span className="text-muted">{o.product.name}</span>
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      sortValue: (o) => Number(o.total),
      render: (o) => <span className="font-medium">${Number(o.total).toFixed(2)}</span>
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      sortValue: (o) => o.status,
      render: (o) => (
        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusStyles[o.status] ?? "text-muted border-border"}`}>
          {statusLabels[o.status] ?? o.status}
        </span>
      )
    },
    {
      key: "payments",
      header: "Pagamento",
      sortable: true,
      sortValue: (o) => o.payments.length,
      render: (o) => {
        const last = o.payments.length > 0 ? o.payments[0] : null; // BUG FIX: Verificar se array tem elementos antes de acessar
        return (
          <div className="flex flex-col text-xs">
            <span className="text-muted">
              {o.payments.length} pagamento{o.payments.length === 1 ? "" : "s"}
            </span>
            {last ? (
              <span className={paymentStatusStyles[last.status] ?? "text-muted"}>
                {paymentStatusLabels[last.status] ?? last.status}
              </span>
            ) : (
              <span className="text-muted">—</span>
            )}
          </div>
        );
      }
    },
    {
      key: "createdAt",
      header: "Data",
      sortable: true,
      sortValue: (o) => new Date(o.createdAt).getTime(),
      render: (o) => <span className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("pt-PT")}</span>
    }
  ];

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Orders & Payments</h1>
              <p className="mt-1 text-sm text-muted">Gestão de encomendas e pagamentos associados.</p>
            </div>
            <Input placeholder="Pesquisar por cliente ou produto" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          </div>
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={orders}
              loading={loading}
              rowKey={(o) => o.id}
              emptyMessage="Nenhuma encomenda encontrada."
              actions={(o) => (
                <div className="flex justify-end gap-2">
                  {o.status === "pending" ? (
                    <button
                      onClick={() => markAsPaid(o)}
                      className="rounded-lg border border-success/40 p-1.5 text-success transition hover:bg-success/10"
                      title="Marcar como paga"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {o.status === "pending" || o.status === "paid" ? (
                    <button
                      onClick={() => cancelOrder(o)}
                      className="rounded-lg border border-danger/40 p-1.5 text-danger transition hover:bg-danger/10"
                      title="Cancelar"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {o.status === "paid" ? (
                    <button
                      onClick={() => refundOrder(o)}
                      className="rounded-lg border border-warning/40 p-1.5 text-warning transition hover:bg-warning/10"
                      title="Reembolsar"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              )}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
