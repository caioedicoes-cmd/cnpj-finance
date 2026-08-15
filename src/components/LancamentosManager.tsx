"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { MonthFilter } from "@/components/MonthFilter";
import { formatBRL, formatDateBR, parseBRLInput } from "@/lib/format";
import type { Category, FixedExpense } from "@/lib/types";

interface Item {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  client?: string | null;
  category_id: string | null;
  fixed_expense_id?: string | null;
}

interface Props {
  kind: "revenue" | "expense";
  companyId: string;
  categories: Category[];
  initialItems: Item[];
  fixedExpenses?: FixedExpense[];
}

const TABLE = { revenue: "revenues", expense: "expenses" } as const;
const LABELS = {
  revenue: {
    singular: "receita",
    plural: "Receitas",
    text: "text-positive",
  },
  expense: {
    singular: "despesa",
    plural: "Despesas",
    text: "text-negative",
  },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function LancamentosManager({ kind, companyId, categories, initialItems, fixedExpenses }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const table = TABLE[kind];
  const label = LABELS[kind];

  const [now] = useState(() => new Date());
  const [items, setItems] = useState(initialItems);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [client, setClient] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const years = useMemo(() => {
    const set = new Set(items.map((i) => Number(i.date.slice(0, 4))));
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [items, now]);

  const filtered = useMemo(
    () =>
      items
        .filter((i) => {
          const d = new Date(i.date + "T00:00:00");
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [items, month, year]
  );

  const total = filtered.reduce((sum, i) => sum + i.amount, 0);

  const pendingFixed = useMemo(() => {
    if (!fixedExpenses) return [];
    const launchedIds = new Set(
      items
        .filter((i) => {
          const d = new Date(i.date + "T00:00:00");
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .map((i) => i.fixed_expense_id)
        .filter(Boolean)
    );
    return fixedExpenses.filter((fe) => fe.active && !launchedIds.has(fe.id));
  }, [fixedExpenses, items, month, year]);

  async function handleLaunchFixed() {
    if (pendingFixed.length === 0) return;
    setLaunching(true);
    setError(null);
    try {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const payload = pendingFixed.map((fe) => ({
        company_id: companyId,
        category_id: fe.category_id,
        description: fe.description,
        amount: fe.amount,
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(
          Math.min(fe.day_of_month, daysInMonth)
        ).padStart(2, "0")}`,
        fixed_expense_id: fe.id,
      }));

      const { data, error: launchError } = await supabase
        .from("expenses")
        .insert(payload)
        .select();

      if (launchError) {
        setError("Não foi possível lançar as despesas fixas. Tente novamente.");
        return;
      }

      setItems((prev) => [...prev, ...((data as Item[]) ?? [])]);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLaunching(false);
    }
  }

  function openNew() {
    setEditing(null);
    setDate(todayISO());
    setAmount("");
    setDescription("");
    setClient("");
    setCategoryId(categories[0]?.id ?? "");
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setDate(item.date);
    setAmount(item.amount.toFixed(2).replace(".", ","));
    setDescription(item.description ?? "");
    setClient(item.client ?? "");
    setCategoryId(item.category_id ?? categories[0]?.id ?? "");
    setError(null);
    setSheetOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseBRLInput(amount);
    if (parsedAmount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      company_id: companyId,
      date,
      amount: parsedAmount,
      description: description || null,
      category_id: categoryId || null,
    };
    if (kind === "revenue") payload.client = client || null;

    const { data, error } = editing
      ? await supabase.from(table).update(payload).eq("id", editing.id).select().single()
      : await supabase.from(table).insert(payload).select().single();

    setSaving(false);

    if (error) {
      setError(`Não foi possível salvar a ${label.singular}.`);
      return;
    }

    setItems((prev) =>
      editing
        ? prev.map((i) => (i.id === editing.id ? (data as Item) : i))
        : [...prev, data as Item]
    );
    setSheetOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(`Excluir esta ${label.singular}?`)) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setError(`Não foi possível excluir a ${label.singular}.`);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <MonthFilter month={month} year={year} years={years} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        <Button onClick={openNew} size="sm">
          <Plus size={16} /> Nova {label.singular}
        </Button>
      </div>

      {pendingFixed.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stamp/30 bg-stamp-tint px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-stamp-ink">
            <Repeat size={16} />
            <span>
              {pendingFixed.length} despesa{pendingFixed.length > 1 ? "s" : ""} fixa
              {pendingFixed.length > 1 ? "s" : ""} pendente{pendingFixed.length > 1 ? "s" : ""} neste mês
            </span>
          </div>
          <Button onClick={handleLaunchFixed} disabled={launching} size="sm" variant="secondary">
            {launching ? "Lançando…" : "Lançar agora"}
          </Button>
        </div>
      )}

      <div className="mb-4 flex items-baseline justify-between rounded-xl border border-line bg-paper-raised px-4 py-3">
        <span className="text-sm text-ink-muted">Total no período</span>
        <span className={`font-mono-figures text-lg font-medium ${label.text}`}>
          {formatBRL(total)}
        </span>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">{error}</p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
          <p className="text-sm text-ink-muted">
            Nenhuma {label.singular} lançada neste mês.
          </p>
          <Button onClick={openNew} variant="secondary" size="sm" className="mt-3">
            <Plus size={16} /> Lançar {label.singular}
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-paper-raised">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {item.description || categoryName(item.category_id)}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {formatDateBR(item.date)} · {categoryName(item.category_id)}
                  {item.client ? ` · ${item.client}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`font-mono-figures text-sm font-medium ${label.text}`}>
                  {formatBRL(item.amount)}
                </span>
                <button
                  onClick={() => openEdit(item)}
                  aria-label="Editar"
                  className="p-1 text-ink-faint transition hover:text-ink"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  aria-label="Excluir"
                  className="p-1 text-ink-faint transition hover:text-negative"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? `Editar ${label.singular}` : `Nova ${label.singular}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data">
              <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Valor (R$)">
              <Input
                required
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </Field>
          </div>
          <Field label="Categoria">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          {kind === "revenue" && (
            <Field label="Cliente">
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Opcional" />
            </Field>
          )}
          <Field label="Descrição">
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </Field>
          {error && (
            <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Salvando…" : editing ? "Salvar alterações" : `Lançar ${label.singular}`}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setSheetOpen(false);
                  handleDelete(editing.id);
                }}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </form>
      </Sheet>
    </div>
  );
}
