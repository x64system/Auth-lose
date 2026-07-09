import { Bell, Globe, Moon, Search } from "lucide-react";
import { Input } from "@/components/ui";

export function Topbar() {
  return (
    <header className="card glass mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
        <Input placeholder="Pesquisar utilizador, key, produto..." className="pl-9" />
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-xl border border-border bg-card p-2 text-muted hover:bg-hover hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <button className="rounded-xl border border-border bg-card p-2 text-muted hover:bg-hover hover:text-foreground">
          <Moon className="h-4 w-4" />
        </button>
        <button className="rounded-xl border border-border bg-card p-2 text-muted hover:bg-hover hover:text-foreground">
          <Globe className="h-4 w-4" />
        </button>
        <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted">Admin</div>
      </div>
    </header>
  );
}
