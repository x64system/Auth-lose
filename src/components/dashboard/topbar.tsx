"use client";

import Link from "next/link";
import { Bell, Globe, Moon, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui";
import { useTheme } from "@/components/theme-provider";
import { useCommandPalette } from "@/components/command-palette";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const palette = useCommandPalette();

  return (
    <header className="card glass mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
        <Input
          placeholder="Pesquisar utilizador, key, produto... (⌘K)"
          className="pl-9"
          onFocus={(e) => {
            e.target.blur();
            palette?.open();
          }}
          readOnly
        />
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/notifications"
          className="rounded-xl border border-border bg-card p-2 text-muted transition hover:bg-hover hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="rounded-xl border border-border bg-card p-2 text-muted transition hover:bg-hover hover:text-foreground"
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <button className="rounded-xl border border-border bg-card p-2 text-muted hover:bg-hover hover:text-foreground">
          <Globe className="h-4 w-4" />
        </button>
        <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted">Admin</div>
      </div>
    </header>
  );
}
