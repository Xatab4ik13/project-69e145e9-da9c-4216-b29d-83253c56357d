-- Токены RuStore Push устройств клиентов приложения.
create table if not exists client_push_tokens (
  token text primary key,
  phone text not null,
  created_at timestamptz not null default now()
);
create index if not exists client_push_tokens_phone_idx on client_push_tokens (phone);
alter table bookings add column if not exists client_reminder_sent_at timestamptz;
