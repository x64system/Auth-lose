import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function OrdersPage() {
  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">Orders & Payments</h1>
          <p className="mt-1 text-sm text-muted">Stripe, PayPal, PIX e Criptomoedas prontos para integração.</p>
        </div>
      </section>
    </main>
  );
}
