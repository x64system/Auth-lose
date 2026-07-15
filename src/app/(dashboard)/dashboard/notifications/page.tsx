"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { apiFetch, ApiError } from "@/lib/http-client";

type Notification = { id: string; title: string; body: string; read: boolean; createdAt: string };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Notification[]>("/api/notifications")
      .then(setNotifications)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar notificações"));
  }, []);

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {error ? (
            <p className="mt-4 text-sm text-danger">{error}</p>
          ) : !notifications ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-hover" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sem notificações por agora.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                  <div>
                    <p className={n.read ? "text-muted" : "text-foreground"}>{n.title}</p>
                    <p className="text-xs text-muted">{n.body}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted">
                    {new Date(n.createdAt).toLocaleDateString("pt-PT")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
