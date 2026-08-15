import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Conta</p>
        <h1 className="font-display text-2xl text-ink">Minha conta</h1>
        <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
      </header>
      <ChangePasswordForm email={user.email!} />
    </div>
  );
}
