-- Платформа устройства клиента: android (RuStore) или ios (APNs).
alter table client_push_tokens add column if not exists platform text not null default 'android';
