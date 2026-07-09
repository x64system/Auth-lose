"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button, Input } from "@/components/ui";

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [q, setQ] = useState("");
  async function load() {
    const res = await fetch(`/api/licenses${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setLicenses(await res.json());
  }
  useEffect(() => {
    load();
  }, [q]);
  async function disable(id: string) {
    await fetch(`/api/licenses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "REVOKED" }) });
    load();
  }
  async function enable(id: string) {
    await fetch(`/api/licenses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACTIVE" }) });
    load();
  }
  async function renew(id: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await fetch(`/api/licenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt: expiresAt.toISOString() })
    });
    load();
  }
  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
        <h1 className="text-2xl font-semibold">Sistema de Keys</h1>
          <div className="mt-4">
            <Input placeholder="Procurar key" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mt-4 space-y-2">
            {licenses.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="font-medium">{l.code}</p>
                  <p className="text-xs text-muted">{l.type} • {l.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="bg-success text-black" onClick={() => enable(l.id)}>
                    Enable
                  </Button>
                  <Button className="bg-warning text-black" onClick={() => disable(l.id)}>
                    Disable
                  </Button>
                  <Button className="bg-card text-foreground" onClick={() => renew(l.id)}>
                    Renew
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
