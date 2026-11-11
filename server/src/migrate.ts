import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "./db";

const dir = join(import.meta.dir, "..", "migrations");
await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
const done = new Set((await sql`select name from schema_migrations`).map((r: { name: string }) => r.name));

for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(file)) continue;
  await sql.begin(async (tx) => {
    await tx.unsafe(readFileSync(join(dir, file), "utf8"));
    await tx`insert into schema_migrations (name) values (${file})`;
  });
  console.log("applied", file);
}
console.log("migrations up to date");
await sql.close();
