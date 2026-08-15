-- Migração: Despesas Fixas
-- Rode este script inteiro no SQL Editor do Supabase (seu banco já existe,
-- não precisa rodar o schema.sql completo de novo — só isto aqui).

create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  day_of_month smallint not null check (day_of_month between 1 and 28),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.fixed_expenses enable row level security;

drop policy if exists "fixed_expenses_select_own" on public.fixed_expenses;
create policy "fixed_expenses_select_own" on public.fixed_expenses
  for select using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

drop policy if exists "fixed_expenses_insert_own" on public.fixed_expenses;
create policy "fixed_expenses_insert_own" on public.fixed_expenses
  for insert with check (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

drop policy if exists "fixed_expenses_update_own" on public.fixed_expenses;
create policy "fixed_expenses_update_own" on public.fixed_expenses
  for update using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

drop policy if exists "fixed_expenses_delete_own" on public.fixed_expenses;
create policy "fixed_expenses_delete_own" on public.fixed_expenses
  for delete using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

alter table public.expenses
  add column if not exists fixed_expense_id uuid references public.fixed_expenses (id) on delete set null;

create index if not exists expenses_fixed_expense_idx on public.expenses (fixed_expense_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.fixed_expenses to authenticated;
