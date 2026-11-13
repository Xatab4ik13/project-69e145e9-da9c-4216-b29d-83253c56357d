-- Вход клиентов приложения по коду из Telegram Gateway.
create table if not exists client_auth_codes (
  phone text primary key,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists client_sessions (
  token_hash text primary key,
  phone text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists client_sessions_phone_idx on client_sessions (phone);
