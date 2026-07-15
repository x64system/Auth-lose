"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator
} from "cmdk";
import {
  LayoutDashboard,
  Package,
  KeyRound,
  Users,
  CreditCard,
  TrendingUp,
  Bell,
  Settings,
  UserCircle2,
  type LucideIcon
} from "lucide-react";
import { apiFetch } from "@/lib/http-client";

type PaletteContextValue = { open: () => void; close: () => void };
const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useCommandPalette() {
  return useContext(PaletteContext);
}

const staticPages: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/dashboard/products", icon: Package },
  { label: "Licenças", href: "/dashboard/licenses", icon: KeyRound },
  { label: "Utilizadores", href: "/dashboard/users", icon: Users },
  { label: "Encomendas", href: "/dashboard/orders", icon: CreditCard },
  { label: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { label: "Notificações", href: "/dashboard/notifications", icon: Bell },
  { label: "Definições", href: "/dashboard/settings", icon: Settings },
  { label: "Perfil", href: "/dashboard/profile", icon: UserCircle2 }
];

type SearchResults = {
  users: { id: string; name: string; email: string }[];
  licenses: { id: string; code: string; status: string }[];
  products: { id: string; name: string; status: string }[];
};

const emptyResults: SearchResults = { users: [], licenses: [], products: [] };

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const router = useRouter();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults(emptyResults);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(emptyResults);
      return;
    }
    const qs = `?q=${encodeURIComponent(query.trim())}`;
    const handle = setTimeout(async () => {
      const [users, licenses, products] = await Promise.allSettled([
        apiFetch<SearchResults["users"]>(`/api/users${qs}`),
        apiFetch<SearchResults["licenses"]>(`/api/licenses${qs}`),
        apiFetch<SearchResults["products"]>(`/api/products${qs}`)
      ]);
      setResults({
        users: users.status === "fulfilled" ? users.value.slice(0, 5) : [],
        licenses: licenses.status === "fulfilled" ? licenses.value.slice(0, 5) : [],
        products: products.status === "fulfilled" ? products.value.slice(0, 5) : []
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function go(href: string) {
    close();
    // `href` é construído dinamicamente (ex.: com query params de pesquisa),
    // por isso não corresponde a um literal conhecido do `typedRoutes`.
    router.push(href as Parameters<typeof router.push>[0]);
  }

  const hasResults = results.users.length + results.licenses.length + results.products.length > 0;

  return (
    <PaletteContext.Provider value={{ open, close }}>
      {children}
      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        label="Command palette"
        overlayClassName="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        contentClassName="fixed left-1/2 top-24 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          autoFocus
          placeholder="Pesquisar páginas, utilizadores, licenças, produtos..."
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <CommandList className="max-h-96 overflow-y-auto p-2">
          <CommandEmpty className="px-3 py-6 text-center text-sm text-muted">Sem resultados.</CommandEmpty>

          <CommandGroup heading="Navegação" className="px-1 pb-1 text-xs font-medium text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            {staticPages.map((p) => (
              <CommandItem
                key={p.href}
                value={p.label}
                onSelect={() => go(p.href)}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground aria-selected:bg-hover"
              >
                <p.icon className="h-4 w-4 text-muted" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>

          {hasResults ? <CommandSeparator className="my-1 h-px bg-border" /> : null}

          {results.users.length > 0 && (
            <CommandGroup heading="Utilizadores" className="px-1 pb-1 text-xs font-medium text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {results.users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`user-${u.id}-${u.email}`}
                  onSelect={() => go(`/dashboard/users?q=${encodeURIComponent(u.email)}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground aria-selected:bg-hover"
                >
                  <Users className="h-4 w-4 text-muted" />
                  <span>{u.name}</span>
                  <span className="text-xs text-muted">{u.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.licenses.length > 0 && (
            <CommandGroup heading="Licenças" className="px-1 pb-1 text-xs font-medium text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {results.licenses.map((l) => (
                <CommandItem
                  key={l.id}
                  value={`license-${l.id}-${l.code}`}
                  onSelect={() => go(`/dashboard/licenses?q=${encodeURIComponent(l.code)}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground aria-selected:bg-hover"
                >
                  <KeyRound className="h-4 w-4 text-muted" />
                  <span>{l.code}</span>
                  <span className="text-xs text-muted">{l.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.products.length > 0 && (
            <CommandGroup heading="Produtos" className="px-1 pb-1 text-xs font-medium text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {results.products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`product-${p.id}-${p.name}`}
                  onSelect={() => go(`/dashboard/products?q=${encodeURIComponent(p.name)}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground aria-selected:bg-hover"
                >
                  <Package className="h-4 w-4 text-muted" />
                  <span>{p.name}</span>
                  <span className="text-xs text-muted">{p.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted">
          <span>↑↓ navegar · ↵ selecionar</span>
          <span>esc para fechar</span>
        </div>
      </CommandDialog>
    </PaletteContext.Provider>
  );
}
