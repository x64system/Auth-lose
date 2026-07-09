import Link from "next/link";
import { Button } from "./ui";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide">
          <span className="rounded-lg border border-border bg-card px-2 py-1">Inject</span> Bypass
        </Link>
        <nav className="hidden gap-6 text-sm text-muted md:flex">
          <a href="#features">Features</a>
          <a href="#plans">Planos</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="flex gap-2">
          <Link href="/login">
            <Button className="bg-card text-foreground hover:bg-hover">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-foreground text-bg">Register</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
