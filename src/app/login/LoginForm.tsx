"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell eyebrow="Livro Caixa" title="Entrar na sua conta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Senha">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando…" : "Entrar"}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/esqueci-senha" className="text-ink-muted hover:text-stamp">
            Esqueci a senha
          </Link>
          <Link href="/cadastro" className="font-medium text-stamp hover:text-stamp-ink">
            Criar conta
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
