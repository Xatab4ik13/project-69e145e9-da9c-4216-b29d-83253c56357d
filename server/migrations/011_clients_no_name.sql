-- Имена клиентов не собираются: ни на сайте, ни в приложении, ни в CRM.
alter table clients drop column if exists name;
