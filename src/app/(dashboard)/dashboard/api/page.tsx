"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Copy, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/modal";
import { DataTable, type Column } from "@/components/data-table";
import { apiFetch, ApiError } from "@/lib/http-client";
import { useConfirm } from "@/components/confirm-dialog";

type ApiKeyOwner = { id: string; name: string; email: string };

type ApiKeyRow = {
  id: string;
  key: string;
  name: string;
  userId: string;
  revoked: boolean;
  createdAt: string;
  // Só presente quando o utilizador atual é staff (MODERATOR+) — a própria
  // presença deste campo é o que decide se a coluna "Dono" é mostrada.
  user?: ApiKeyOwner;
};

type CreatedApiKey = { id: string; name: string; key: string; createdAt: string };

export default function ApiPage() {
  const confirm = useConfirm();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal de revelação — mostra a key completa uma única vez, imediatamente
  // após a criação. Depois disto fechar, o valor completo nunca mais é
  // recuperável (nem pela própria API).
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<ApiKeyRow[]>("/api/keys");
      setKeys(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createKey() {
    const keyName = name.trim() ? name.trim() : `Chave API - ${new Date().toLocaleTimeString("pt-PT")}`;
    setCreating(true);
    try {
      const created = await apiFetch<CreatedApiKey>("/api/keys", {
        method: "POST",
        body: JSON.stringify({ name: keyName })
      });
      setName("");
      setCreatedKey(created);
      toast.success(`API key "${created.name}" criada`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar API key");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(apiKey: ApiKeyRow) {
    const ok = await confirm({
      title: "Revogar API key",
      description: `Tem a certeza que deseja revogar a key "${apiKey.name}"? Deixará de funcionar de imediato.`,
      confirmLabel: "Revogar"
    });
    if (!ok) return;
    try {
      await apiFetch(`/api/keys/${apiKey.id}`, { method: "PUT", body: JSON.stringify({ revoked: true }) });
      toast.success(`API key "${apiKey.name}" revogada`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao revogar API key");
    }
  }

  async function deleteKey(apiKey: ApiKeyRow) {
    const ok = await confirm({
      title: "Eliminar API key",
      description: `Tem a certeza que deseja eliminar "${apiKey.name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Eliminar",
      danger: true
    });
    if (!ok) return;
    try {
      await apiFetch(`/api/keys/${apiKey.id}`, { method: "DELETE" });
      toast.success(`API key "${apiKey.name}" eliminada`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao eliminar API key");
    }
  }

  async function copyCreatedKey() {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      toast.success("Key copiada");
    } catch {
      toast.error("Não foi possível copiar a key");
    }
  }

  // A API só inclui o campo `user` na resposta quando o utilizador atual é
  // staff (MODERATOR+); usamos isso para decidir se a coluna é mostrada.
  const showOwnerColumn = keys.some((k) => k.user);

  const columns: Column<ApiKeyRow>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      sortValue: (k) => k.name.toLowerCase(),
      render: (k) => <span className="font-medium">{k.name}</span>
    },
    {
      key: "key",
      header: "Key",
      render: (k) => <span className="font-mono text-xs text-muted">{k.key}</span>
    },
    ...(showOwnerColumn
      ? [
          {
            key: "owner",
            header: "Dono",
            sortable: true,
            sortValue: (k) => k.user?.name.toLowerCase() ?? "",
            render: (k) => <span className="text-muted">{k.user ? `${k.user.name} (${k.user.email})` : "—"}</span>
          } as Column<ApiKeyRow>
        ]
      : []),
    {
      key: "createdAt",
      header: "Criado em",
      sortable: true,
      sortValue: (k) => new Date(k.createdAt).getTime(),
      render: (k) => <span className="text-xs text-muted">{new Date(k.createdAt).toLocaleDateString("pt-PT")}</span>
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      sortValue: (k) => (k.revoked ? 1 : 0),
      render: (k) =>
        k.revoked ? (
          <span className="inline-flex items-center gap-1 text-xs text-danger">
            <Ban className="h-3 w-3" /> Revogada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="h-3 w-3" /> Ativa
          </span>
        )
    }
  ];

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">API Management</h1>
          <p className="mt-1 text-sm text-muted">Gestão de API Keys, limites de requests e documentação Swagger.</p>

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="max-w-xs flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">Nova API Key</label>
              <Input
                placeholder="Nome da key (ex.: Integração CI)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button onClick={createKey} disabled={creating}>
              {creating ? "A criar..." : "Criar Key"}
            </Button>
          </div>

          <div className="mt-6">
            <DataTable
              columns={columns}
              data={keys}
              loading={loading}
              rowKey={(k) => k.id}
              emptyMessage="Nenhuma API key encontrada."
              actions={(k) => (
                <div className="flex justify-end gap-2">
                  {!k.revoked ? (
                    <button
                      onClick={() => revokeKey(k)}
                      className="rounded-lg border border-border p-1.5 text-muted transition hover:bg-hover hover:text-foreground"
                      title="Revogar"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => deleteKey(k)}
                    className="rounded-lg border border-danger/40 p-1.5 text-danger transition hover:bg-danger/10"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      </section>

      {/* Modal de revelação da key completa — mostrado uma única vez */}
      <Modal
        isOpen={!!createdKey}
        onClose={() => setCreatedKey(null)}
        title="API Key criada"
        footer={
          <>
            <Button className="bg-card text-foreground" onClick={copyCreatedKey}>
              <span className="inline-flex items-center gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copiar
              </span>
            </Button>
            <Button className="bg-success text-black" onClick={() => setCreatedKey(null)}>
              Já guardei, fechar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="font-medium text-danger">
            Guarde esta key agora — não voltará a ser mostrada por completo.
          </p>
          <div className="break-all rounded-xl border border-border bg-bg p-3 font-mono text-xs text-foreground">
            {createdKey?.key}
          </div>
        </div>
      </Modal>
    </main>
  );
}
