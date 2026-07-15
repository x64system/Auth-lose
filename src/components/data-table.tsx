"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  actions?: (row: T) => React.ReactNode;
};

/**
 * Tabela genérica com paginação e ordenação client-side, skeleton de
 * loading e animação de entrada por linha. Usada em Users/Licenses/
 * Products/Logs/Orders/API Keys para manter uma experiência consistente
 * em toda a área administrativa.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyMessage = "Nenhum registo encontrado.",
  pageSize = 8,
  actions
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [data]);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageData = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  function toggleSort(col: Column<T>) {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-hover/40 text-xs uppercase text-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col)}
                  className={clsx("select-none whitespace-nowrap px-4 py-3", col.sortable && "cursor-pointer", col.className)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable ? (
                      sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
              {actions ? <th className="px-4 py-3 text-right">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="skeleton h-4 w-full rounded" />
                    </td>
                  ))}
                  {actions ? <td className="px-4 py-3" /> : null}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-10 text-center text-sm text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {pageData.map((row, i) => (
                  <motion.tr
                    key={rowKey(row)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    className="border-t border-border transition hover:bg-hover/40"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={clsx("px-4 py-3", col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                    {actions ? <td className="px-4 py-3 text-right">{actions(row)}</td> : null}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
      {!loading && sorted.length > 0 ? (
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>
            {(clampedPage - 1) * pageSize + 1}–{Math.min(clampedPage * pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={clampedPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border p-1.5 transition hover:bg-hover disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Página {clampedPage} / {totalPages}
            </span>
            <button
              disabled={clampedPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-border p-1.5 transition hover:bg-hover disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
