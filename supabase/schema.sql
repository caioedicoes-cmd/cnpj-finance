-- Livro Caixa (CNPJ) — schema + RLS
-- Rode este script inteiro no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

-- 1. profiles ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Cria automaticamente um profile quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. companies ---------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  nome_fantasia text,
  cnpj text not null,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "companies_select_own" on public.companies
  for select using (auth.uid() = user_id);
create policy "companies_insert_own" on public.companies
  for insert with check (auth.uid() = user_id);
create policy "companies_update_own" on public.companies
  for update using (auth.uid() = user_id);
create policy "companies_delete_own" on public.companies
  for delete using (auth.uid() = user_id);

-- 3. categories ----------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  type text not null check (type in ('revenue', 'expense')),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "categories_insert_own" on public.categories
  for insert with check (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "categories_update_own" on public.categories
  for update using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "categories_delete_own" on public.categories
  for delete using (
    company_id in (select id from public.companies where user_id = auth.uid())
    and is_default = false
  );

-- 4. revenues --------------------------------------------------------------
create table if not exists public.revenues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  client text,
  created_at timestamptz not null default now()
);

alter table public.revenues enable row level security;

create policy "revenues_select_own" on public.revenues
  for select using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "revenues_insert_own" on public.revenues
  for insert with check (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "revenues_update_own" on public.revenues
  for update using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "revenues_delete_own" on public.revenues
  for delete using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- 5. expenses ----------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
  for select using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "expenses_insert_own" on public.expenses
  for insert with check (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "expenses_update_own" on public.expenses
  for update using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "expenses_delete_own" on public.expenses
  for delete using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- 6. despesas fixas (recorrentes) -----------------------------------------
-- "Modelos" de despesa mensal (aluguel, software, contabilidade...). O
-- usuário cadastra uma vez e, todo mês, lança as pendências com um clique.
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

create policy "fixed_expenses_select_own" on public.fixed_expenses
  for select using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "fixed_expenses_insert_own" on public.fixed_expenses
  for insert with check (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "fixed_expenses_update_own" on public.fixed_expenses
  for update using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );
create policy "fixed_expenses_delete_own" on public.fixed_expenses
  for delete using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- Liga cada lançamento de despesa à despesa fixa que o originou (quando é o
-- caso), pra saber quais meses já foram lançados e evitar duplicidade.
alter table public.expenses
  add column if not exists fixed_expense_id uuid references public.fixed_expenses (id) on delete set null;

create index if not exists expenses_fixed_expense_idx on public.expenses (fixed_expense_id);

-- 7. permissões do role "authenticated" -----------------------------------
-- RLS controla QUAIS linhas um role pode ver/alterar, mas o Postgres exige
-- também um GRANT dizendo que o role pode tocar na tabela. O Supabase
-- costuma fazer isso sozinho quando a tabela é criada pelo Table Editor,
-- mas ao rodar SQL puro isso precisa ser feito manualmente — sem isso, toda
-- query autenticada falha com "permission denied for table ..." (42501),
-- mesmo com as policies certas.
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.revenues to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.fixed_expenses to authenticated;

-- 8. índices úteis -------------------------------------------------------
create index if not exists revenues_company_date_idx on public.revenues (company_id, date);
create index if not exists expenses_company_date_idx on public.expenses (company_id, date);
create index if not exists categories_company_idx on public.categories (company_id);

-- 9. categorias padrão criadas automaticamente para cada nova empresa -----
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (company_id, name, type, is_default) values
    (new.id, 'Serviços', 'revenue', true),
    (new.id, 'Vendas', 'revenue', true),
    (new.id, 'Outros', 'revenue', true),
    (new.id, 'Software', 'expense', true),
    (new.id, 'Equipamentos', 'expense', true),
    (new.id, 'Internet', 'expense', true),
    (new.id, 'Marketing', 'expense', true),
    (new.id, 'Contabilidade', 'expense', true),
    (new.id, 'Impostos', 'expense', true),
    (new.id, 'Outros', 'expense', true);
  return new;
end;
$$;

drop trigger if exists on_company_created on public.companies;
create trigger on_company_created
  after insert on public.companies
  for each row execute procedure public.seed_default_categories();
