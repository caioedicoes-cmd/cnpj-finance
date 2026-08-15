"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function describeError(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.name;
  return "";
}

export function ChangePasswordForm({ email }: { email: string }) {
  const supabase = createClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("A nova senha precisa ser diferente da senha atual.");
      return;
    }

    setLoading(true);
    try {
      // Confirma a senha atual antes de trocar, por segurança — evita que
      // alguém com a sessão aberta (ex: dispositivo compartilhado) troque a
      // senha sem saber a atual.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setError("Senha atual incorreta.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(describeError(updateError) || "Não foi possível atualizar a senha.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(describeError(err) || "Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md rounded-2xl border border-line bg-paper-raised p-6 space-y-4"
    >
      <Field label="Senha atual">
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <Field label="Nova senha">
        <Input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </Field>
      <Field label="Confirmar nova senha">
        <Input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a nova senha"
        />
      </Field>
      {error && (
        <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-positive-tint px-3 py-2 text-sm text-positive">
          Senha atualizada com sucesso.
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Atualizando…" : "Atualizar senha"}
      </Button>
    </form>
  );
}
