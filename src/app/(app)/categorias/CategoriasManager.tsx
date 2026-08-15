"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { Category } from "@/lib/types";

function CategoryList({
  items,
  accentClass,
  onRemove,
}: {
  items: Category[];
  accentClass: string;
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-line">
      {items.map((c) => (
        <li key={c.id} className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${accentClass}`} />
            <span className="text-sm text-ink">{c.name}</span>
          </div>
          {c.is_default ? (
            <span title="Categoria padrão" className="text-ink-faint">
              <Lock size={14} />
            </span>
          ) : (
            <button
              onClick={() => onRemove(c.id)}
              aria-label={`Excluir ${c.name}`}
              className="p-1 text-ink-faint transition hover:text-negative"
            >
              <Trash2 size={14} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function CategoriasManager({
  companyId,
  initialCategories,
}: {
  companyId: string;
  initialCategories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [newRevenue, setNewRevenue] = useState("");
  const [newExpense, setNewExpense] = useState("");
  const [error, setError] = useState<string | null>(null);

  const revenues = categories.filter((c) => c.type === "revenue");
  const expenses = categories.filter((c) => c.type === "expense");

  async function addCategory(type: "revenue" | "expense", name: string) {
    if (!name.trim()) return;
    setError(null);
    const { data, error } = await supabase
      .from("categories")
      .insert({ company_id: companyId, name: name.trim(), type, is_default: false })
      .select()
      .single();
    if (error) {
      setError("Não foi possível criar a categoria.");
      return;
    }
    setCategories((prev) => [...prev, data as Category]);
    if (type === "revenue") {
      setNewRevenue("");
    } else {
      setNewExpense("");
    }
    router.refresh();
  }

  async function removeCategory(id: string) {
    if (!confirm("Excluir esta categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      setError("Não foi possível excluir. Ela pode estar em uso por um lançamento.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">{error}</p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="mb-3 font-display text-lg text-ink">Receitas</h2>
          <CategoryList items={revenues} accentClass="bg-positive" onRemove={removeCategory} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addCategory("revenue", newRevenue);
            }}
            className="mt-4 flex gap-2"
          >
            <Input
              value={newRevenue}
              onChange={(e) => setNewRevenue(e.target.value)}
              placeholder="Nova categoria"
            />
            <Button type="submit" variant="secondary" size="sm" aria-label="Adicionar">
              <Plus size={16} />
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="mb-3 font-display text-lg text-ink">Despesas</h2>
          <CategoryList items={expenses} accentClass="bg-negative" onRemove={removeCategory} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addCategory("expense", newExpense);
            }}
            className="mt-4 flex gap-2"
          >
            <Input
              value={newExpense}
              onChange={(e) => setNewExpense(e.target.value)}
              placeholder="Nova categoria"
            />
            <Button type="submit" variant="secondary" size="sm" aria-label="Adicionar">
              <Plus size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
