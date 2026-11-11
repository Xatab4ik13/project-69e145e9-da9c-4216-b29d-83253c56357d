-- Owner's money out: article bills, one-off costs and washer payouts.
create table finance_ops (
  id uuid primary key default gen_random_uuid(),
  date text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  kind text not null check (kind in ('expense', 'payout')),
  article text,
  washer text,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index finance_ops_date_idx on finance_ops(date);

-- Per-month plan changes for stable articles: (2026-12, rent) -> 100000.
create table plan_overrides (
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  article text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  primary key (month, article)
);
