"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Pencil } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/modal";
import { DataTable, type Column } from "@/components/data-table";
import { apiFetch, ApiError } from "@/lib/http-client";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initialQ = new URLSearchParams(window.location.search).get("q");
    if (initialQ) setQ(initialQ);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<User[]>(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setUsers(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar utilizadores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function toggleBan(user: User) {
    try {
      await apiFetch(`/api/users/${user.id}`, { method: "PUT", body: JSON.stringify({ isBanned: !user.isBanned }) });
      toast.success(user.isBanned ? `${user.name} foi desbanido` : `${user.name} foi banido`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar utilizador");
    }
  }

  function startEdit(user: User) {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditRole(user.role || "USER");
  }

  async function saveEdit() {
    if (!editingUser) return;
    setSaving(true);
    try {
      await apiFetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editName, role: editRole })
      });
      toast.success("Utilizador atualizado");
      setEditingUser(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao guardar utilizador");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<User>[] = [
    { key: "name", header: "Nome", sortable: true, sortValue: (u) => u.name.toLowerCase(), render: (u) => <span className="font-medium">{u.name}</span> },
    { key: "email", header: "Email", sortable: true, sortValue: (u) => u.email.toLowerCase(), render: (u) => <span className="text-muted">{u.email}</span> },
    { key: "role", header: "Cargo", sortable: true, sortValue: (u) => u.role, render: (u) => <span className="rounded-full border border-border px-2 py-0.5 text-xs">{u.role}</span> },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      sortValue: (u) => (u.isBanned ? 1 : 0),
      render: (u) =>
        u.isBanned ? (
          <span className="inline-flex items-center gap-1 text-xs text-danger">
            <Ban className="h-3 w-3" /> Banido
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="h-3 w-3" /> Ativo
          </span>
        )
    },
    {
      key: "createdAt",
      header: "Criado em",
      sortable: true,
      sortValue: (u) => new Date(u.createdAt).getTime(),
      render: (u) => <span className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString("pt-PT")}</span>
    }
  ];

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">Gestão de Utilizadores</h1>
            <Input placeholder="Pesquisar por nome ou email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          </div>
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={users}
              loading={loading}
              rowKey={(u) => u.id}
              emptyMessage="Nenhum utilizador encontrado."
              actions={(u) => (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => startEdit(u)}
                    className="rounded-lg border border-border p-1.5 text-muted transition hover:bg-hover hover:text-foreground"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleBan(u)}
                    className={
                      u.isBanned
                        ? "rounded-lg border border-success/40 p-1.5 text-success transition hover:bg-success/10"
                        : "rounded-lg border border-danger/40 p-1.5 text-danger transition hover:bg-danger/10"
                    }
                    title={u.isBanned ? "Desbanir" : "Banir"}
                  >
                    {u.isBanned ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      </section>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Utilizador"
        footer={
          <>
            <Button className="bg-card text-foreground" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button className="bg-success text-black" onClick={saveEdit} disabled={saving}>
              {saving ? "A guardar..." : "Salvar"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Nome Completo</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Função (Cargo)</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-0 transition-all focus:border-light"
            >
              <option value="USER">USER</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="SUPPORT">SUPPORT</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
          {editingUser && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Email (Não editável)</label>
              <Input value={editingUser.email} disabled className="opacity-60 cursor-not-allowed" />
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
}
