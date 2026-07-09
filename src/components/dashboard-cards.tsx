const cards = [
  ["Total Users", "12,420"],
  ["Active Licenses", "9,320"],
  ["Expired Licenses", "1,218"],
  ["Revenue", "$128,440"],
  ["Sales Today", "248"],
  ["Products", "42"],
  ["Online Users", "892"],
  ["API Requests", "1.2M"]
];

export function DashboardCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="card glass p-5">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </section>
  );
}
