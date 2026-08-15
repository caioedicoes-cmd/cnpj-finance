export function AuthShell({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="ledger-rules flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-stamp text-stamp">
            <span className="font-display text-lg italic">Lc</span>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
            {eyebrow}
          </p>
          <h1 className="font-display text-2xl text-ink mt-1">{title}</h1>
        </div>
        <div className="rounded-2xl border border-line bg-paper-raised p-6 shadow-[0_1px_2px_rgba(16,21,31,0.04)]">
          {children}
        </div>
      </div>
    </div>
  );
}
