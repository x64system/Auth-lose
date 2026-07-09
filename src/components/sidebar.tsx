import Link from "next/link";
import { Bell, TrendingUp, CreditCard, KeyRound, LayoutDashboard, LogOut, Package, Settings, UserCircle2, Users, LucideIcon } from "lucide-react";

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
] as const;

export function Sidebar() {
  return (
    <aside className="card glass h-fit p-4">
      <p className="px-2 py-3 text-sm font-medium">Inject Bypass</p>
      <nav className="space-y-1">
        {links.map(([label, href, Icon]) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-hover hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
        <button className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger transition hover:bg-hover">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </nav>
    </aside>
  );
}
