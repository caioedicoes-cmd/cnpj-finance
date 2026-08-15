"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço informado.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell eyebrow="Livro Caixa" title="Verifique seu e-mail">
        <p className="text-sm text-ink-muted">
          Se <strong className="text-ink">{email}</strong> estiver cadastrado, você vai
          receber um link para redefinir sua senha.
        </p>
        <Link href="/login" className="mt-4 block text-sm font-medium text-stamp hover:text-stamp-ink">
          Voltar para o login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Livro Caixa" title="Recuperar senha">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail cadastrado">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enviando…" : "Enviar link de recuperação"}
        </Button>
        <Link href="/login" className="block text-center text-sm text-ink-muted hover:text-stamp">
          Voltar para o login
        </Link>
      </form>
    </AuthShell>
  );
}
