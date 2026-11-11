# Aquarius API

Серверная часть сайта и CRM: Bun + Hono + PostgreSQL. Работает на 127.0.0.1:4000,
Caddy пересылает на неё все адреса `/api/*` (см. `Caddyfile.example`).

## Команды
- `bun install` — зависимости
- `bun run migrate` — применить миграции из `migrations/`
- `bun run create-user <логин> <owner|admin>` — создать аккаунт или сменить пароль
- `bun run start` — запустить API
- `TEST_DATABASE_URL=postgres://... bun test` — тесты (база будет очищена!)

Настройки берутся из переменных окружения, пример — `.env.example`.
