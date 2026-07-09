"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/modal";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  async function load() {
    const res = await fetch(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setUsers(await res.json());
  }

  useEffect(() => {
    load();
  }, [q]);

  async function toggleBan(id: string, isBanned: boolean) {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned })
    });
    load();
  }

  function startEdit(user: any) {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditRole(user.role || "USER");
  }

  async function saveEdit() {
    if (!editingUser) return;
    await fetch(`/api/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, role: editRole })
    });
    setEditingUser(null);
    load();
  }

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">Gestão de Utilizadores</h1>
          <div className="mt-4">
            <Input placeholder="Pesquisar por nome ou email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mt-4 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="font-medium">{u.name} ({u.role})</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="bg-card text-foreground" onClick={() => startEdit(u)}>
                    Editar
                  </Button>
                  <Button className={u.isBanned ? "bg-success text-black" : "bg-danger text-white"} onClick={() => toggleBan(u.id, u.isBanned)}>
                    {u.isBanned ? "Unban" : "Ban"}
                  </Button>
                </div>
              </div>
            ))}
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
            <Button className="bg-success text-black" onClick={saveEdit}>
              Salvar
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
