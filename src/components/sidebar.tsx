"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Bell, TrendingUp, CreditCard, KeyRound, LayoutDashboard, Package, Settings, UserCircle2, Users, LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/logout-button";

const links = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Products", "/dashboard/products", Package],
  ["Licenses", "/dashboard/licenses", KeyRound],
  ["Users", "/dashboard/users", Users],
  ["Orders", "/dashboard/orders", CreditCard],
  ["Analytics", "/dashboard/analytics", TrendingUp],
  ["Logs", "/dashboard/logs", Bell],
  ["Notifications", "/dashboard/notifications", Bell],
  ["API", "/dashboard/api", KeyRound],
  ["Settings", "/dashboard/settings", Settings],
  ["Profile", "/dashboard/profile", UserCircle2]
] as const satisfies readonly (readonly [string, string, LucideIcon])[];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="card glass h-fit p-4">
      <p className="px-2 py-3 text-sm font-medium">Inject Bypass</p>
      <nav className="space-y-1">
        {links.map(([label, href, Icon]) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                active ? "bg-hover text-foreground" : "text-muted hover:bg-hover hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        <LogoutButton />
      </nav>
    </aside>
  );
}
