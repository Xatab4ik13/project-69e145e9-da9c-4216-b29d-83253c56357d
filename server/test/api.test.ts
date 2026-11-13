// Needs a throwaway database: TEST_DATABASE_URL=postgres://... bun test
import { beforeAll, describe, expect, test } from "bun:test";
import { SQL } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "../src/app";

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

d("Aquarius API", () => {
  const sql = new SQL(url ?? "postgres://localhost/none");
  // 2026-11-11 12:30 Moscow
  const app = createApp(sql, { secureCookie: false, now: () => new Date("2026-11-11T09:30:00Z") });
  const call = (path: string, init: RequestInit = {}, cookie = "") =>
    app.request(`/api/v1${path}`, { ...init, headers: { "content-type": "application/json", "x-forwarded-for": crypto.randomUUID(), ...(cookie ? { cookie } : {}), ...init.headers } });
  const login = async (l: string) => {
    const res = await call("/auth/login", { method: "POST", body: JSON.stringify({ login: l, password: "secret123" }) });
    return res.headers.get("set-cookie")?.split(";")[0] ?? "";
  };
  const site = (start: number, extras: string[] = []) => call("/bookings", { method: "POST", body: JSON.stringify({
    date: "2026-11-12", start, car: "Kia Rio", carType: "седан", phone: "9001112233", packageName: "Комфорт",
    services: [{ name: "Комплекс «Комфорт»", price: 1600 }], extras }) });

  beforeAll(async () => {
    await sql.unsafe("drop schema public cascade; create schema public;");
    for (const f of ["001_init.sql", "002_no_overlap.sql", "003_finance.sql", "004_push.sql", "005_client_auth.sql", "006_client_cars.sql", "007_bonus.sql"]) await sql.unsafe(readFileSync(join(import.meta.dir, "..", "migrations", f), "utf8"));
    const hash = await Bun.password.hash("secret123");
    await sql`insert into users (login, password_hash, role) values ('owner', ${hash}, 'owner'), ('admin', ${hash}, 'admin')`;
  });

  test("wrong password is rejected", async () => {
    const res = await call("/auth/login", { method: "POST", body: JSON.stringify({ login: "owner", password: "nope" }) });
    expect(res.status).toBe(401);
  });

  test("CRM is closed without login", async () => {
    expect((await call("/crm/bookings?from=2026-11-01&to=2026-11-30")).status).toBe(401);
  });

  test("each account gets its own role", async () => {
    expect(await (await call("/auth/me", {}, await login("owner"))).json()).toEqual({ login: "owner", role: "owner" });
    expect(await (await call("/auth/me", {}, await login("admin"))).json()).toEqual({ login: "admin", role: "admin" });
  });

  test("only the owner saves the price list", async () => {
    const body = JSON.stringify({ catalog: [] });
    expect((await call("/crm/prices", { method: "PUT", body }, await login("admin"))).status).toBe(403);
    expect((await call("/crm/prices", { method: "PUT", body }, await login("owner"))).status).toBe(200);
  });

  test("site booking: 60 min slot plus add-on minutes, box 1 then box 2, third is refused", async () => {
    const a = await site(11 * 60, ["Антидождь"]);
    expect(a.status).toBe(201);
    expect((await a.json()).duration).toBe(80);
    expect((await site(11 * 60)).status).toBe(201);
    expect((await site(11 * 60)).status).toBe(409);
    const cookie = await login("admin");
    const list = (await (await call("/crm/bookings?from=2026-11-12&to=2026-11-12", {}, cookie)).json()).bookings;
    expect(list.map((b: { box: number }) => b.box).sort()).toEqual([1, 2]);
    expect(list.every((b: { source: string; confirmed: boolean }) => b.source === "site" && !b.confirmed)).toBe(true);
  });

  test("past time cannot be booked from the site", async () => {
    const res = await call("/bookings", { method: "POST", body: JSON.stringify({
      date: "2026-11-11", start: 11 * 60, car: "Kia Rio", phone: "9001112233", packageName: "Стандарт", services: [{ name: "x", price: 1 }] }) });
    expect(res.status).toBe(409);
  });

  test("free slots skip the taken hour", async () => {
    const { slots } = await (await call("/slots?date=2026-11-12")).json();
    expect(slots).not.toContain(11 * 60);
    expect(slots).toContain(10 * 60);
  });

  test("confirmed booking starts by itself when its time comes", async () => {
    const cookie = await login("admin");
    const res = await call("/crm/bookings", { method: "POST", body: JSON.stringify({
      date: "2026-11-11", box: 1, start: 13 * 60, duration: 60, car: "Lada", phone: "9001112233", packageName: "Стандарт", services: [{ name: "x", price: 1200 }] }) }, cookie);
    const { booking } = await res.json();
    await call(`/crm/bookings/${booking.id}`, { method: "PATCH", body: JSON.stringify({ confirmed: true }) }, cookie);
    const later = createApp(sql, { secureCookie: false, now: () => new Date("2026-11-11T10:05:00Z") });
    const list = await (await later.request("/api/v1/crm/bookings?from=2026-11-11&to=2026-11-11", { headers: { cookie } })).json();
    expect(list.bookings.find((b: { id: string }) => b.id === booking.id).wash).toBe("in_progress");
  });
  test("ten simultaneous bookings for one time: at most one per box", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => call("/bookings", { method: "POST", body: JSON.stringify({
      date: "2026-11-13", start: 15 * 60, car: "Kia Rio", carType: "седан", phone: "9001112233", packageName: "Комфорт",
      services: [{ name: "x", price: 1 }], extras: [] }) })));
    expect(results.filter((r) => r.status === 201).length).toBe(2);
    expect(results.filter((r) => r.status === 409).length).toBe(8);
  });

  test("database refuses an overlapping booking in one box even past the app checks", async () => {
    const row = { date: "2026-11-14", box: 1, start_min: 600, duration: 60, car: "a", source: "admin", package_name: "x", services: "[]" };
    await sql`insert into bookings ${sql(row)}`;
    let code = "";
    try { await sql`insert into bookings ${sql({ ...row, start_min: 630 })}`; } catch (e) { code = (e as { errno?: string }).errno ?? ""; }
    expect(code).toBe("23P01");
    await sql`insert into bookings ${sql({ ...row, start_min: 660 })}`;
  });
  test("finance: owner records payments and plan, admin only reads", async () => {
    const owner = await login("owner");
    const admin = await login("admin");
    const op = { date: "2026-11-01", kind: "expense", article: "rent", name: "Аренда", amount: 97955.5 };
    expect((await call("/crm/finance/ops", { method: "POST", body: JSON.stringify(op) }, admin)).status).toBe(403);
    const res = await call("/crm/finance/ops", { method: "POST", body: JSON.stringify(op) }, owner);
    expect(res.status).toBe(201);
    const { op: saved } = await res.json();
    await call("/crm/finance/plan", { method: "PUT", body: JSON.stringify({ month: "2026-12", article: "rent", amount: 100000 }) }, owner);
    const fin = await (await call("/crm/finance", {}, admin)).json();
    expect(fin.ops.map((o: { amount: number }) => o.amount)).toEqual([97955.5]);
    expect(fin.overrides).toEqual({ "2026-12": { rent: 100000 } });
    await call(`/crm/finance/ops/${saved.id}`, { method: "DELETE" }, owner);
    expect((await (await call("/crm/finance", {}, owner)).json()).ops).toEqual([]);
  });
});

