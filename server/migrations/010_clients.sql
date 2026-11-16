-- Общая база клиентов и их машин (сайт, приложение, CRM).
create table if not exists clients (
  phone text primary key,
  name text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table client_cars add column if not exists cls smallint;
alter table client_cars add column if not exists last_used_at timestamptz not null default now();
update client_cars set last_used_at = created_at;

insert into clients (phone, created_at, last_seen_at)
select p, min(t), max(t) from (
  select right(regexp_replace(phone, '\D', '', 'g'), 10) as p, created_at as t from bookings
  union all select phone, created_at from client_sessions
) x where length(p) = 10 group by p
on conflict (phone) do nothing;

insert into client_cars (phone, car, car_type, created_at, last_used_at)
select p, car, car_type, used, used from (
  select right(regexp_replace(phone, '\D', '', 'g'), 10) as p, trim(car) as car,
    (array_agg(car_type order by created_at desc))[1] as car_type, max(created_at) as used
  from bookings where trim(car) <> '' group by 1, 2
) x where length(p) = 10
on conflict (phone, car) do update set last_used_at = greatest(client_cars.last_used_at, excluded.last_used_at);

delete from client_cars where id in (
  select id from (select id, row_number() over (partition by phone order by last_used_at desc) as rn from client_cars) r where rn > 5
);
create index if not exists clients_last_seen_idx on clients (last_seen_at desc);
