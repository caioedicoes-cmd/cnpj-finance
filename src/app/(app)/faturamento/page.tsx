import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, MESES } from "@/lib/format";
import { YearSwitcher } from "./YearSwitcher";

function monthKey(date: string) {
  return date.slice(0, 7);
}

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!company) redirect("/empresa");

  const params = await searchParams;
  const year = Number(params.ano) || new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [{ data: revenues }, { data: expenses }, { data: allRevenues }] = await Promise.all([
    supabase.from("revenues").select("date, amount").eq("company_id", company.id).gte("date", yearStart).lte("date", yearEnd),
    supabase.from("expenses").select("date, amount").eq("company_id", company.id).gte("date", yearStart).lte("date", yearEnd),
    supabase.from("revenues").select("date").eq("company_id", company.id),
  ]);

  const years = Array.from(
    new Set([
      ...(allRevenues ?? []).map((r) => Number(r.date.slice(0, 4))),
      new Date().getFullYear(),
    ])
  ).sort((a, b) => b - a);

  const rows = MESES.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const rev = (revenues ?? []).filter((r) => monthKey(r.date) === key).reduce((s, r) => s + Number(r.amount), 0);
    const exp = (expenses ?? []).filter((e) => monthKey(e.date) === key).reduce((s, e) => s + Number(e.amount), 0);
    return { label, rev, exp, result: rev - exp };
  });

  const totalRev = rows.reduce((s, r) => s + r.rev, 0);
  const totalExp = rows.reduce((s, r) => s + r.exp, 0);
  const totalResult = totalRev - totalExp;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Relatório anual</p>
          <h1 className="font-display text-2xl text-ink">Faturamento</h1>
        </div>
        <YearSwitcher years={years} current={year} />
      </header>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Mês</th>
              <th className="px-4 py-3 font-medium text-right">Receitas</th>
              <th className="px-4 py-3 font-medium text-right">Despesas</th>
              <th className="px-4 py-3 font-medium text-right">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-4 py-2.5 text-ink">{r.label}</td>
                <td className="font-mono-figures px-4 py-2.5 text-right text-positive">{formatBRL(r.rev)}</td>
                <td className="font-mono-figures px-4 py-2.5 text-right text-negative">{formatBRL(r.exp)}</td>
                <td className={`font-mono-figures px-4 py-2.5 text-right font-medium ${r.result >= 0 ? "text-positive" : "text-negative"}`}>
                  {formatBRL(r.result)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong bg-paper font-medium">
              <td className="px-4 py-3 text-ink">Total {year}</td>
              <td className="font-mono-figures px-4 py-3 text-right text-positive">{formatBRL(totalRev)}</td>
              <td className="font-mono-figures px-4 py-3 text-right text-negative">{formatBRL(totalExp)}</td>
              <td className={`font-mono-figures px-4 py-3 text-right ${totalResult >= 0 ? "text-positive" : "text-negative"}`}>
                {formatBRL(totalResult)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
