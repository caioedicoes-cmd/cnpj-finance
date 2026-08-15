# Livro Caixa — Controle financeiro do CNPJ

App simples e separado do seu app de finanças pessoais, focado só no CNPJ:
receitas, despesas, faturamento mensal/anual — pronto para passar pro contador.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Auth + Postgres + RLS).

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** → cole o conteúdo de `supabase/schema.sql` → **Run**.
   Isso cria as tabelas (`profiles`, `companies`, `categories`, `revenues`,
   `expenses`), ativa RLS em todas elas e configura dois triggers:
   - ao criar um usuário, gera o `profile` automaticamente;
   - ao cadastrar uma empresa, semeia as categorias padrão
     (Serviços/Vendas/Outros em receitas; Software/Equipamentos/Internet/
     Marketing/Contabilidade/Impostos/Outros em despesas).
3. Em **Authentication → URL Configuration**, adicione a URL do seu app
   (localhost em dev, o domínio da Vercel em produção) em **Site URL** e em
   **Redirect URLs** adicione `SEU_DOMINIO/auth/callback`.
4. Em **Authentication → Email**, o fluxo de "Confirm signup" e "Reset
   password" já vêm prontos — não precisa mexer, só garantir que o remetente
   padrão do Supabase está ativo (ou configurar SMTP próprio, se preferir).

## 2. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com os dados do seu
projeto (**Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

## 3. Rodar localmente

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:3000`, crie sua conta, confirme o e-mail e cadastre
os dados da sua empresa (nome, nome fantasia, CNPJ) — isso acontece no
primeiro acesso, antes de liberar o resto do app.

## 4. Deploy na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com) → **Add New Project** → importe o
   repositório.
3. Em **Environment Variables**, adicione as mesmas duas variáveis do
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy. Depois, volte no Supabase e adicione a URL da Vercel em **Site
   URL** e **Redirect URLs** (passo 1.3 acima) — sem isso o login/recuperação
   de senha não redireciona certo em produção.

## Estrutura

```
src/app/(app)/dashboard     Dashboard: cards do mês/ano + gráfico de faturamento
src/app/(app)/receitas      Lançar, editar, excluir e filtrar receitas
src/app/(app)/despesas      Lançar, editar, excluir e filtrar despesas
src/app/(app)/faturamento   Relatório anual (tabela mês a mês) com troca de ano
src/app/(app)/categorias    Categorias padrão + criação/exclusão de personalizadas
src/app/(app)/empresa       Cadastro/edição dos dados do CNPJ
supabase/schema.sql         Schema completo + RLS + triggers
```

## O que foi propositalmente deixado de fora

Seguindo o escopo do MVP: sem upload de anexos, sem exportação PDF/Excel/CSV,
sem emissão de nota fiscal, sem integração bancária/Open Finance, sem cálculo
automático de impostos e sem folha de pagamento. Cada usuário só enxerga os
próprios dados (RLS em todas as tabelas).
