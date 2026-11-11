import { createApp } from "./app";
import { sql } from "./db";
import { runReminders } from "./push";

const app = createApp(sql, { secureCookie: process.env.COOKIE_SECURE === "true" });
const port = Number(process.env.PORT ?? 4000);
const hostname = process.env.HOST ?? "127.0.0.1";
Bun.serve({ port, hostname, fetch: app.fetch });
setInterval(() => runReminders(sql).catch((e) => console.error("reminders", e)), 60_000);
console.log(`Aquarius API on http://${hostname}:${port}`);
