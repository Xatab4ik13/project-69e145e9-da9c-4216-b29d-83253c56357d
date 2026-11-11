create extension if not exists pgcrypto;

create table users (
  id serial primary key,
  login text not null unique,
  password_hash text not null,
  role text not null check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create table sessions (
  token_hash text primary key,
  user_id int not null references users(id) on delete cascade,
  expires_at timestamptz not null
);
create index sessions_user_idx on sessions(user_id);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  date text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  box smallint not null check (box in (1, 2)),
  start_min int not null check (start_min >= 0 and start_min < 1440),
  duration int not null check (duration > 0 and duration <= 1440),
  car text not null,
  car_type text not null default '',
  phone text not null default '',
  source text not null check (source in ('site', 'app', 'admin')),
  package_name text not null,
  services jsonb not null,
  wash text not null default 'scheduled' check (wash in ('scheduled', 'in_progress', 'done', 'cancelled')),
  confirmed boolean not null default false,
  payment text not null default 'unpaid' check (payment in ('unpaid', 'awaiting', 'paid')),
  payment_method text check (payment_method in ('terminal', 'cash', 'app')),
  washer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_date_idx on bookings(date);

-- One row: the whole price list as edited in CRM «Услуги».
create table price_catalog (
  id int primary key check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
