-- Бонусы, которыми клиент приложения оплачивает часть мойки.
alter table bookings add column if not exists bonus int not null default 0 check (bonus >= 0);
