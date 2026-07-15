"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/modal";
import { DataTable, type Column } from "@/components/data-table";
import { apiFetch, ApiError } from "@/lib/http-client";
import { useConfirm } from "@/components/confirm-dialog";

type Product = {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  status: string;
  price: number | string | null;
};

export default function ProductsPage() {
  const confirm = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPrice, setEditPrice] = useState<number | string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initialQ = new URLSearchParams(window.location.search).get("q");
    if (initialQ) setQ(initialQ);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Product[]>(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setProducts(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function createProduct() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: "Produto premium",
          version: "1.0.0",
          category: "General",
          status: "active"
        })
      });
      toast.success(`Produto "${name}" criado`);
      setName("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar produto");
    } finally {
      setCreating(false);
    }
  }

  async function removeProduct(product: Product) {
    const ok = await confirm({
      title: "Eliminar produto",
      description: `Tem a certeza que deseja eliminar "${product.name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Eliminar",
      danger: true
    });
    if (!ok) return;
    try {
      await apiFetch(`/api/products/${product.id}`, { method: "DELETE" });
      toast.success(`Produto "${product.name}" eliminado`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir produto");
    }
  }

  function startEdit(product: Product) {
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
    setSaving(true);
    try {
      await apiFetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          version: editVersion,
          category: editCategory,
          status: editStatus,
          price: editPrice ? Number(editPrice) : undefined
        })
      });
      toast.success("Produto atualizado");
      setEditingProduct(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao guardar produto");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Product>[] = [
    { key: "name", header: "Nome", sortable: true, sortValue: (p) => p.name.toLowerCase(), render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "version", header: "Versão", sortable: true, sortValue: (p) => p.version, render: (p) => <span className="text-muted">{p.version}</span> },
    { key: "category", header: "Categoria", sortable: true, sortValue: (p) => p.category, render: (p) => <span className="text-muted">{p.category}</span> },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      sortValue: (p) => p.status,
      render: (p) => (
        <span className={`rounded-full border px-2 py-0.5 text-xs ${p.status === "active" ? "text-success border-success/40" : "text-muted border-border"}`}>
          {p.status}
        </span>
      )
    },
    {
      key: "price",
      header: "Preço",
      sortable: true,
      sortValue: (p) => (p.price ? Number(p.price) : 0),
      render: (p) => <span className="text-muted">{p.price ? `$${Number(p.price).toFixed(2)}` : "—"}</span>
    }
  ];

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Produtos</h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <Input placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-44 bg-card/80 border-border" />
              <Input placeholder="Nome do novo produto..." value={name} onChange={(e) => setName(e.target.value)} className="w-full sm:w-52 bg-card/80 border-border" />
              <Button onClick={createProduct} disabled={creating} className="whitespace-nowrap px-5">
                {creating ? "A criar..." : "+ Criar Produto"}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={products}
              loading={loading}
              rowKey={(p) => p.id}
              emptyMessage="Nenhum produto encontrado."
              actions={(p) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => startEdit(p)} className="rounded-lg border border-border p-1.5 text-muted transition hover:bg-hover hover:text-foreground" title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeProduct(p)} className="rounded-lg border border-danger/40 p-1.5 text-danger transition hover:bg-danger/10" title="Excluir">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            />
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
            <Button className="bg-success text-black" onClick={saveEdit} disabled={saving}>
              {saving ? "A guardar..." : "Salvar"}
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
                <option value="beta">Beta</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
