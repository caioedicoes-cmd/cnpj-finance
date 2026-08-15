"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome }, emailRedirectTo },
    });
    setLoading(false);
    if (error) {
      setError(error.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : "Não foi possível criar a conta. Tente novamente.");
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell eyebrow="Livro Caixa" title="Confirme seu e-mail">
        <p className="text-sm text-ink-muted">
          Enviamos um link de confirmação para <strong className="text-ink">{email}</strong>.
          Abra o e-mail para ativar sua conta e depois faça login.
        </p>
        <Link href="/login" className="mt-4 block text-sm font-medium text-stamp hover:text-stamp-ink">
          Voltar para o login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Livro Caixa" title="Criar sua conta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome">
          <Input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
          />
        </Field>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando…" : "Criar conta"}
        </Button>
        <p className="text-center text-sm text-ink-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-stamp hover:text-stamp-ink">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
