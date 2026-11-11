create table push_subscriptions (
  endpoint text primary key,
  user_id int not null references users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on push_subscriptions(user_id);

alter table bookings add column reminder_sent_at timestamptz;
