-- Машины клиента приложения (до 5 на телефон).
create table if not exists client_cars (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  car text not null,
  car_type text not null default '',
  created_at timestamptz not null default now(),
  unique (phone, car)
);
create index if not exists client_cars_phone_idx on client_cars (phone);
