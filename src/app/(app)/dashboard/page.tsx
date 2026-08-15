import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { RevenueChart } from "./RevenueChart";

function monthKey(date: string) {
  return date.slice(0, 7); // yyyy-mm
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("id, nome_fantasia, nome")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!company) redirect("/empresa");

  const now = new Date();
  const year = now.getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const currentMonthKey = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [{ data: revenues }, { data: expenses }] = await Promise.all([
    supabase
      .from("revenues")
      .select("date, amount")
      .eq("company_id", company.id)
      .gte("date", yearStart)
      .lte("date", yearEnd),
    supabase
      .from("expenses")
      .select("date, amount")
      .eq("company_id", company.id)
      .gte("date", yearStart)
      .lte("date", yearEnd),
  ]);

  const revenuesThisMonth = (revenues ?? []).filter((r) => monthKey(r.date) === currentMonthKey);
  const expensesThisMonth = (expenses ?? []).filter((e) => monthKey(e.date) === currentMonthKey);

  const monthRevenue = revenuesThisMonth.reduce((s, r) => s + Number(r.amount), 0);
  const monthExpense = expensesThisMonth.reduce((s, e) => s + Number(e.amount), 0);
  const monthResult = monthRevenue - monthExpense;

  const yearRevenue = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const yearExpense = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const yearResult = yearRevenue - yearExpense;

  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return (revenues ?? [])
      .filter((r) => monthKey(r.date) === key)
      .reduce((s, r) => s + Number(r.amount), 0);
  });

  const empresa = company.nome_fantasia || company.nome;

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {empresa}
        </p>
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
      </header>

      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        <Card label="Faturamento do mês" value={monthRevenue} tone="positive" />
        <Card label="Despesas do mês" value={monthExpense} tone="negative" />
        <Card label="Resultado do mês" value={monthResult} tone={monthResult >= 0 ? "positive" : "negative"} />
        <Card label="Faturamento no ano" value={yearRevenue} tone="positive" />
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-paper-raised p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-ink">Faturamento por mês — {year}</h2>
        </div>
        <RevenueChart data={monthlyTotals} />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryRow label="Faturamento acumulado" value={yearRevenue} tone="positive" />
        <SummaryRow label="Total de despesas" value={yearExpense} tone="negative" />
        <SummaryRow label="Resultado acumulado" value={yearResult} tone={yearResult >= 0 ? "positive" : "negative"} />
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative";
}) {
  const toneClass = tone === "positive" ? "text-positive" : "text-negative";
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-3.5 sm:p-4">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={`font-mono-figures mt-2 text-base font-semibold leading-tight sm:text-xl ${toneClass}`}>
        {formatBRL(value)}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative";
}) {
  const toneClass = tone === "positive" ? "text-positive" : "text-negative";
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-paper-raised px-4 py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`font-mono-figures text-sm font-medium ${toneClass}`}>
        {formatBRL(value)}
      </span>
    </div>
  );
}
