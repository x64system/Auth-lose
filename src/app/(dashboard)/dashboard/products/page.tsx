"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/modal";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPrice, setEditPrice] = useState<number | string>("");

  async function load() {
    const res = await fetch(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setProducts(await res.json());
  }

  useEffect(() => {
    load();
  }, [q]);

  async function createProduct() {
    if (!name.trim()) return;
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: "Produto premium",
        version: "1.0.0",
        category: "General",
        status: "active"
      })
    });
    setName("");
    load();
  }

  async function removeProduct(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(product: any) {
    setEditingProduct(product);
    setEditName(product.name || "");
    setEditDescription(product.description || "Produto premium");
    setEditVersion(product.version || "1.0.0");
    setEditCategory(product.category || "General");
    setEditStatus(product.status || "active");
    setEditPrice(product.price !== null && product.price !== undefined ? String(product.price) : "");
  }

  async function saveEdit() {
    if (!editingProduct) return;
    await fetch(`/api/products/${editingProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        version: editVersion,
        category: editCategory,
        status: editStatus,
        price: editPrice ? Number(editPrice) : null
      })
    });
    setEditingProduct(null);
    load();
  }

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">Gestão de Produtos</h1>
          <div className="mt-4 flex gap-2">
            <Input placeholder="Pesquisar" value={q} onChange={(e) => setQ(e.target.value)} />
            <Input placeholder="Novo produto" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={createProduct}>Criar</Button>
          </div>
          <div className="mt-4 space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted">{p.version} • {p.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="bg-card text-foreground" onClick={() => startEdit(p)}>
                    Editar
                  </Button>
                  <Button className="bg-danger text-white" onClick={() => removeProduct(p.id)}>
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Editar Produto"
        footer={
          <>
            <Button className="bg-card text-foreground" onClick={() => setEditingProduct(null)}>
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
            <label className="mb-1 block text-xs font-semibold text-muted">Nome do Produto</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Descrição</label>
            <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Versão</label>
              <Input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Preço</label>
              <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Categoria</label>
              <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-0 transition-all focus:border-light"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
