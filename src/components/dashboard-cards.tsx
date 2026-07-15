"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/http-client";

type Stats = {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  users: number;
  products: number;
  orders: number;
  revenue: number;
};

const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "USD" });
const number = new Intl.NumberFormat("pt-PT");

export function DashboardCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<Stats>("/api/stats")
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  const cards: [string, string][] = stats
    ? [
        ["Utilizadores", number.format(stats.users)],
        ["Licenças Ativas", number.format(stats.activeKeys)],
        ["Licenças Expiradas", number.format(stats.expiredKeys)],
        ["Total de Keys", number.format(stats.totalKeys)],
        ["Produtos", number.format(stats.products)],
        ["Encomendas", number.format(stats.orders)],
        ["Receita", currency.format(Number(stats.revenue))]
      ]
    : [];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {error ? (
        <div className="card glass col-span-full p-5 text-sm text-muted">
          Não foi possível carregar as estatísticas.
        </div>
      ) : stats ? (
        cards.map(([label, value], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
            className="card glass p-5"
          >
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </motion.div>
        ))
      ) : (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton card h-[84px] p-5" />
        ))
      )}
    </section>
  );
}
