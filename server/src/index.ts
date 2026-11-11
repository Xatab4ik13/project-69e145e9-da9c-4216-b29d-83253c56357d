import { createApp } from "./app";
import { sql } from "./db";

const app = createApp(sql, { secureCookie: process.env.COOKIE_SECURE === "true" });
const port = Number(process.env.PORT ?? 4000);
const hostname = process.env.HOST ?? "127.0.0.1";
Bun.serve({ port, hostname, fetch: app.fetch });
console.log(`Aquarius API on http://${hostname}:${port}`);
