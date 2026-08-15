"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Repeat,
  BarChart3,
  Tag,
  Building2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receitas", label: "Receitas", icon: ArrowUpCircle },
  { href: "/despesas", label: "Despesas", icon: ArrowDownCircle },
  { href: "/despesas-fixas", label: "Despesas fixas", icon: Repeat },
  { href: "/faturamento", label: "Faturamento", icon: BarChart3 },
  { href: "/categorias", label: "Categorias", icon: Tag },
  { href: "/empresa", label: "Empresa", icon: Building2 },
];

export function Sidebar({ nomeFantasia }: { nomeFantasia: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const content = (
    <>
      <div className="mb-8 flex items-center gap-2.5 px-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stamp text-stamp">
          <span className="font-display text-base italic">Lc</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{nomeFantasia || "Livro Caixa"}</p>
          <p className="text-xs text-ink-muted">Controle do CNPJ</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-stamp-tint text-stamp-ink"
                  : "text-ink-muted hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-negative-tint hover:text-negative"
      >
        <LogOut size={17} strokeWidth={2} />
        Sair
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper-raised px-4 py-3 sm:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-stamp text-stamp">
            <span className="font-display text-sm italic">Lc</span>
          </div>
          <span className="text-sm font-medium text-ink">{nomeFantasia || "Livro Caixa"}</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="p-1.5 text-ink">
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-line bg-paper-raised p-4">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="mb-4 ml-auto p-1 text-ink-muted"
            >
              <X size={20} />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-paper-raised px-4 py-6 sm:flex">
        {content}
      </aside>
    </>
  );
}
