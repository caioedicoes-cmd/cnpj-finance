"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { formatBRL, parseBRLInput } from "@/lib/format";
import type { Category, FixedExpense } from "@/lib/types";

interface Props {
  companyId: string;
  categories: Category[];
  initialItems: FixedExpense[];
}

function describeError(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    const parts = [anyErr.message, anyErr.details, anyErr.hint, anyErr.code].filter(
      (v) => typeof v === "string" && v.length > 0
    );
    if (parts.length > 0) return parts.join(" — ");
  }
  return "";
}

export function FixedExpensesManager({ companyId, categories, initialItems }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState(initialItems);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("5");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [active, setActive] = useState(true);

  function openNew() {
    setEditing(null);
    setDescription("");
    setAmount("");
    setDayOfMonth("5");
    setCategoryId(categories[0]?.id ?? "");
    setActive(true);
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(item: FixedExpense) {
    setEditing(item);
    setDescription(item.description);
    setAmount(item.amount.toFixed(2).replace(".", ","));
    setDayOfMonth(String(item.day_of_month));
    setCategoryId(item.category_id ?? categories[0]?.id ?? "");
    setActive(item.active);
    setError(null);
    setSheetOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseBRLInput(amount);
    const day = Number(dayOfMonth);

    if (!description.trim()) {
      setError("Informe uma descrição.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      setError("O dia do vencimento deve ser entre 1 e 28.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        company_id: companyId,
        description: description.trim(),
        amount: parsedAmount,
        day_of_month: day,
        category_id: categoryId || null,
        active,
      };

      const { data, error: saveError } = editing
        ? await supabase
            .from("fixed_expenses")
            .update(payload)
            .eq("id", editing.id)
            .select()
            .single()
        : await supabase.from("fixed_expenses").insert(payload).select().single();

      if (saveError) {
        setError(describeError(saveError) || "Não foi possível salvar a despesa fixa.");
        return;
      }

      setItems((prev) =>
        editing
          ? prev.map((i) => (i.id === editing.id ? (data as FixedExpense) : i))
          : [...prev, data as FixedExpense]
      );
      setSheetOpen(false);
      router.refresh();
    } catch (err) {
      setError(describeError(err) || "Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta despesa fixa? Lançamentos já gerados não serão apagados.")) return;
    const { error: delError } = await supabase.from("fixed_expenses").delete().eq("id", id);
    if (delError) {
      setError(describeError(delError) || "Não foi possível excluir.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  async function toggleActive(item: FixedExpense) {
    const { data, error: toggleError } = await supabase
      .from("fixed_expenses")
      .update({ active: !item.active })
      .eq("id", item.id)
      .select()
      .single();
    if (toggleError) {
      setError(describeError(toggleError) || "Não foi possível atualizar.");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? (data as FixedExpense) : i)));
    router.refresh();
  }

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  const monthlyTotal = items.filter((i) => i.active).reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      <div className="mb-5 flex items-center justify-end">
        <Button onClick={openNew} size="sm">
          <Plus size={16} /> Nova despesa fixa
        </Button>
      </div>

      <div className="mb-4 flex items-baseline justify-between rounded-xl border border-line bg-paper-raised px-4 py-3">
        <span className="text-sm text-ink-muted">Total fixo por mês (ativas)</span>
        <span className="font-mono-figures text-lg font-medium text-negative">
          {formatBRL(monthlyTotal)}
        </span>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
          <Repeat size={22} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm text-ink-muted">Nenhuma despesa fixa cadastrada ainda.</p>
          <p className="mt-1 text-xs text-ink-faint">
            Ex: aluguel, contabilidade, softwares — o que se repete todo mês.
          </p>
          <Button onClick={openNew} variant="secondary" size="sm" className="mt-3">
            <Plus size={16} /> Cadastrar despesa fixa
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-paper-raised">
          {items
            .slice()
            .sort((a, b) => a.day_of_month - b.day_of_month)
            .map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{item.description}</p>
                    {!item.active && (
                      <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                        Pausada
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Todo dia {item.day_of_month} · {categoryName(item.category_id)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono-figures text-sm font-medium text-negative">
                    {formatBRL(item.amount)}
                  </span>
                  <button
                    onClick={() => toggleActive(item)}
                    className="rounded-full px-2 py-1 text-[11px] font-medium text-ink-muted transition hover:bg-paper hover:text-ink"
                  >
                    {item.active ? "Pausar" : "Ativar"}
                  </button>
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
        title={editing ? "Editar despesa fixa" : "Nova despesa fixa"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Descrição">
            <Input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel do escritório"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)">
              <Input
                required
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Dia do vencimento">
              <Input
                required
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
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
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-line-strong"
            />
            Ativa (entra no lançamento automático mensal)
          </label>
          {error && (
            <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar despesa fixa"}
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
