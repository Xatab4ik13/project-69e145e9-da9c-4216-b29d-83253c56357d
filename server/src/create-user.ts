// Usage: bun run src/create-user.ts <login> <owner|admin>
// Asks for the password, creates the account or replaces its password.
import { sql } from "./db";

const [login, role] = process.argv.slice(2);
if (!login || (role !== "owner" && role !== "admin")) {
  console.error("Usage: bun run src/create-user.ts <login> <owner|admin>");
  process.exit(1);
}
const password = prompt("Пароль (минимум 8 символов):")?.trim() ?? "";
if (password.length < 8) {
  console.error("Пароль слишком короткий");
  process.exit(1);
}
const hash = await Bun.password.hash(password);
await sql`
  insert into users (login, password_hash, role) values (${login.toLowerCase()}, ${hash}, ${role})
  on conflict (login) do update set password_hash = excluded.password_hash, role = excluded.role`;
await sql`delete from sessions where user_id = (select id from users where login = ${login.toLowerCase()})`;
console.log(`Аккаунт ${login} (${role}) сохранён`);
await sql.close();
