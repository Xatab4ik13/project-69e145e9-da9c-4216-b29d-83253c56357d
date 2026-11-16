-- Онлайн-оплата счёта через интернет-эквайринг Т-Банка.
create table if not exists payments (
  order_id text primary key,
  booking_id uuid not null references bookings(id),
  payment_id text,
  amount int not null check (amount > 0), -- в копейках
  status text not null default 'NEW',
  payment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_booking on payments (booking_id);
