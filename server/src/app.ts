import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import type { SQL } from "bun";
import { CLOSE_MIN, OPEN_MIN, addDays, findConflict, isPastSlot, smartSlots, withinHours } from "../../src/lib/crm/logic";
import { MIN_WASH_MIN, catalogDuration } from "../../src/lib/crm/booking-rules";
import { DEFAULT_SERVICE_CATALOG } from "../../src/lib/crm/services";
import { washNow } from "../../src/lib/crm/clock";
import { carInfo, logoFile, searchCars } from "./carsbase";
import type { Booking } from "../../src/lib/crm/types";

const COOKIE = "aq_session";
const SESSION_DAYS = 30;
/** Site visitors may book up to this many days ahead. */
const BOOK_AHEAD_DAYS = 30;

type Role = "owner" | "admin";
type User = { id: number; login: string; role: Role };
type Env = { Variables: { user: User } };

const sha256 = (s: string) => new Bun.CryptoHasher("sha256").update(s).digest("hex");

/** Tiny in-memory limiter — enough for one server process. */
function limiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string) => {
    const now = Date.now();
    const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    list.push(now);
    hits.set(key, list);
    return list.length <= max;
  };
}

const ip = (c: Context) => c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "local";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const phoneSchema = z.string().regex(/^\d{10}$/);
const serviceLine = z.object({ name: z.string().trim().min(1).max(300), price: z.number().int().min(0).max(1_000_000) });

const siteBookingSchema = z.object({
  date: dateSchema,
  start: z.number().int(),
  car: z.string().trim().min(1).max(120),
  carType: z.string().trim().max(60).default(""),
  phone: phoneSchema,
  packageName: z.string().trim().min(1).max(120),
  services: z.array(serviceLine).min(1).max(20),
  extras: z.array(z.string().max(120)).max(20).default([]),
  cls: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(1),
});

const crmBookingSchema = z.object({
  date: dateSchema,
  box: z.union([z.literal(1), z.literal(2)]),
  start: z.number().int(),
  duration: z.number().int().min(1).max(CLOSE_MIN - OPEN_MIN),
  car: z.string().trim().min(1).max(120),
  carType: z.string().trim().max(60).default(""),
  phone: phoneSchema,
  packageName: z.string().trim().min(1).max(120),
  services: z.array(serviceLine).min(1).max(20),
});

const patchSchema = z.object({
  wash: z.enum(["scheduled", "in_progress", "done", "cancelled"]).optional(),
  confirmed: z.boolean().optional(),
  payment: z.enum(["unpaid", "awaiting", "paid"]).optional(),
  paymentMethod: z.enum(["terminal", "cash", "app"]).nullable().optional(),
  washer: z.string().trim().min(1).max(60).nullable().optional(),
});

const classValues = z.object({ price: z.number().int().min(0).max(1_000_000).nullable(), minutes: z.number().int().min(0).max(1440).nullable() });
const catalogSchema = z.array(z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(200),
  group: z.string().min(1).max(100),
  unit: z.literal("за диск").optional(),
  classes: z.object({ 1: classValues, 2: classValues, 3: classValues, 4: classValues }),
})).max(200);

type Row = {
  id: string; date: string; box: number; start_min: number; duration: number; car: string; car_type: string; phone: string;
  source: Booking["source"]; package_name: string; services: Booking["services"] | string; wash: Booking["wash"]; confirmed: boolean;
  payment: Booking["payment"]; payment_method: Booking["paymentMethod"] | null; washer: string | null;
};

export const toBooking = (r: Row): Booking => ({
  id: r.id, date: r.date, box: r.box as 1 | 2, start: r.start_min, duration: r.duration, car: r.car, carType: r.car_type,
  phone: r.phone || undefined, source: r.source, packageName: r.package_name,
  services: typeof r.services === "string" ? JSON.parse(r.services) : r.services,
  wash: r.wash, confirmed: r.confirmed, payment: r.payment,
  ...(r.payment_method ? { paymentMethod: r.payment_method } : {}), ...(r.washer ? { washer: r.washer } : {}),
});

export function createApp(sql: SQL, opts: { secureCookie: boolean; now?: () => Date }) {
  const now = () => washNow(opts.now?.() ?? new Date());
  const loginLimit = limiter(10, 15 * 60_000);
  const bookingLimit = limiter(5, 60 * 60_000);
  const app = new Hono<Env>().basePath("/api/v1");

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Внутренняя ошибка сервера" }, 500);
  });

  const body = async <T>(c: Context, schema: z.ZodType<T>) => {
    const parsed = schema.safeParse(await c.req.json().catch(() => null));
    return parsed.success ? parsed.data : null;
  };

  /** Confirmed bookings start by themselves when their time comes. */
  const autoStart = async () => {
    const { today, nowMin } = now();
    await sql`update bookings set wash = 'in_progress', updated_at = now()
      where wash = 'scheduled' and confirmed and (date < ${today} or (date = ${today} and start_min <= ${nowMin}))`;
  };

  const dayBookings = async (tx: SQL, date: string) =>
    ((await tx`select * from bookings where date = ${date} and wash <> 'cancelled'`) as Row[]).map(toBooking);

  const loadCatalog = async () => {
    const [row] = await sql`select data from price_catalog where id = 1`;
    return row ? (typeof row.data === "string" ? JSON.parse(row.data) : row.data) : DEFAULT_SERVICE_CATALOG;
  };

  // ---------- public ----------
  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/prices", async (c) => {
    const [row] = await sql`select data from price_catalog where id = 1`;
    return c.json({ catalog: row ? (typeof row.data === "string" ? JSON.parse(row.data) : row.data) : DEFAULT_SERVICE_CATALOG });
  });

  // ---------- автомобили (Cars Base) ----------
  app.get("/cars/search", async (c) => {
    const q = (c.req.query("q") ?? "").trim().slice(0, 60);
    if (q.length < 2) return c.json({ cars: [] });
    try { return c.json({ cars: await searchCars(q) }); } catch (e) { console.error(e); return c.json({ error: "Каталог автомобилей недоступен" }, 502); }
  });
  app.get("/cars/info", async (c) => {
    const model = c.req.query("model") ?? "";
    if (!/^[A-Z0-9_-]{1,80}$/i.test(model)) return c.json({ error: "Неверная модель" }, 400);
    try { return c.json(await carInfo(model)); } catch (e) { console.error(e); return c.json({ error: "Каталог автомобилей недоступен" }, 502); }
  });
  app.get("/cars/logo/:mark", async (c) => {
    const file = await logoFile(c.req.param("mark")).catch((e) => { console.error(e); return null; });
    if (!file) return c.body(null, 404);
    return new Response(Bun.file(file), { headers: { "content-type": "image/png", "cache-control": "public, max-age=2592000" } });
  });

  app.get("/slots", async (c) => {
    const date = dateSchema.safeParse(c.req.query("date"));
    if (!date.success) return c.json({ error: "Неверная дата" }, 400);
    const extras = (c.req.query("extras") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
    const clsNum = Number(c.req.query("cls") ?? 1);
    const cls = ([1, 2, 3, 4] as const).find((n) => n === clsNum) ?? 1;
    const duration = catalogDuration(await loadCatalog(), c.req.query("pkg") ?? "", extras, cls);
    const { today, nowMin } = now();
    if (date.data < today || date.data > addDays(today, BOOK_AHEAD_DAYS)) return c.json({ duration, slots: [] });
    const slots = smartSlots(await dayBookings(sql, date.data), date.data, duration, today, nowMin, MIN_WASH_MIN);
    return c.json({ duration, slots: slots.map((s) => s.start) });
  });

  app.post("/bookings", async (c) => {
    if (!bookingLimit(ip(c))) return c.json({ error: "Слишком много записей. Позвоните нам." }, 429);
    const data = await body(c, siteBookingSchema);
    if (!data) return c.json({ error: "Проверьте данные записи" }, 400);
    const duration = catalogDuration(await loadCatalog(), data.packageName, data.extras, data.cls);
    const { today, nowMin } = now();
    if (data.date > addDays(today, BOOK_AHEAD_DAYS) || isPastSlot(data.date, data.start, today, nowMin) || !withinHours(data.start, duration))
      return c.json({ error: "Это время недоступно" }, 409);
    const created = await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext(${data.date}))`;
      const list = await dayBookings(tx, data.date);
      const box = smartSlots(list, data.date, duration, today, nowMin, MIN_WASH_MIN).find((sl) => sl.start === data.start)?.box;
      if (!box) return null;
      const [row] = await tx`insert into bookings (date, box, start_min, duration, car, car_type, phone, source, package_name, services)
        values (${data.date}, ${box}, ${data.start}, ${duration}, ${data.car}, ${data.carType}, ${data.phone}, 'site', ${data.packageName}, ${JSON.stringify(data.services)}::text::jsonb)
        returning *`;
      return toBooking(row as Row);
    });
    if (!created) return c.json({ error: "Это время уже заняли. Выберите другое." }, 409);
    return c.json({ id: created.id, date: created.date, start: created.start, duration: created.duration }, 201);
  });

  // ---------- auth ----------
  app.post("/auth/login", async (c) => {
    if (!loginLimit(ip(c))) return c.json({ error: "Слишком много попыток. Подождите 15 минут." }, 429);
    const data = await body(c, z.object({ login: z.string().trim().min(1).max(60), password: z.string().min(1).max(200) }));
    if (!data) return c.json({ error: "Введите логин и пароль" }, 400);
    const [user] = await sql`select id, login, role, password_hash from users where login = ${data.login.toLowerCase()}`;
    if (!user || !(await Bun.password.verify(data.password, user.password_hash))) return c.json({ error: "Неверный логин или пароль" }, 401);
    const token = crypto.randomUUID() + crypto.randomUUID();
    await sql`insert into sessions (token_hash, user_id, expires_at) values (${sha256(token)}, ${user.id}, now() + ${`${SESSION_DAYS} days`}::interval)`;
    await sql`delete from sessions where expires_at < now()`;
    setCookie(c, COOKIE, token, { httpOnly: true, secure: opts.secureCookie, sameSite: "Lax", path: "/", maxAge: SESSION_DAYS * 86400 });
    return c.json({ login: user.login, role: user.role });
  });

  const requireUser = async (c: Context<Env>, next: () => Promise<void>) => {
    const token = getCookie(c, COOKIE);
    if (!token) return c.json({ error: "Войдите в CRM" }, 401);
    const [user] = await sql`select u.id, u.login, u.role from sessions s join users u on u.id = s.user_id
      where s.token_hash = ${sha256(token)} and s.expires_at > now()`;
    if (!user) return c.json({ error: "Войдите в CRM" }, 401);
    c.set("user", user as User);
    await next();
  };

  app.post("/auth/logout", async (c) => {
    const token = getCookie(c, COOKIE);
    if (token) await sql`delete from sessions where token_hash = ${sha256(token)}`;
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json({ ok: true });
  });

  app.get("/auth/me", requireUser, (c) => {
    const { login, role } = c.get("user");
    return c.json({ login, role });
  });

  // ---------- CRM ----------
  app.use("/crm/*", requireUser);

  app.get("/crm/bookings", async (c) => {
    const from = dateSchema.safeParse(c.req.query("from"));
    const to = dateSchema.safeParse(c.req.query("to"));
    if (!from.success || !to.success) return c.json({ error: "Неверный период" }, 400);
    await autoStart();
    const rows = await sql`select * from bookings where date between ${from.data} and ${to.data} order by date, start_min`;
    return c.json({ bookings: (rows as Row[]).map(toBooking) });
  });

  app.post("/crm/bookings", async (c) => {
    const data = await body(c, crmBookingSchema);
    if (!data) return c.json({ error: "Проверьте данные записи" }, 400);
    const { today, nowMin } = now();
    if (isPastSlot(data.date, data.start, today, nowMin) || !withinHours(data.start, data.duration)) return c.json({ error: "Это время недоступно" }, 409);
    const created = await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext(${data.date}))`;
      if (findConflict(await dayBookings(tx, data.date), { date: data.date, box: data.box, start: data.start, duration: data.duration })) return null;
      const [row] = await tx`insert into bookings (date, box, start_min, duration, car, car_type, phone, source, package_name, services)
        values (${data.date}, ${data.box}, ${data.start}, ${data.duration}, ${data.car}, ${data.carType}, ${data.phone}, 'admin', ${data.packageName}, ${JSON.stringify(data.services)}::text::jsonb)
        returning *`;
      return toBooking(row as Row);
    });
    if (!created) return c.json({ error: "Это время уже занято" }, 409);
    return c.json({ booking: created }, 201);
  });

  app.patch("/crm/bookings/:id", async (c) => {
    const id = z.string().uuid().safeParse(c.req.param("id"));
    const data = await body(c, patchSchema);
    if (!id.success || !data) return c.json({ error: "Неверные данные" }, 400);
    const [cur] = await sql`select * from bookings where id = ${id.data}`;
    if (!cur) return c.json({ error: "Запись не найдена" }, 404);
    const b = toBooking(cur as Row);
    const next = {
      wash: data.wash ?? b.wash,
      confirmed: data.confirmed ?? b.confirmed,
      payment: data.payment ?? b.payment,
      payment_method: data.paymentMethod === undefined ? b.paymentMethod ?? null : data.paymentMethod,
      washer: data.washer === undefined ? b.washer ?? null : data.washer,
    };
    const [row] = await sql`update bookings set wash = ${next.wash}, confirmed = ${next.confirmed}, payment = ${next.payment},
      payment_method = ${next.payment_method}, washer = ${next.washer}, updated_at = now() where id = ${id.data} returning *`;
    return c.json({ booking: toBooking(row as Row) });
  });

  app.put("/crm/prices", async (c) => {
    if (c.get("user").role !== "owner") return c.json({ error: "Сохранять прайс может только владелец" }, 403);
    const data = await body(c, z.object({ catalog: catalogSchema }));
    if (!data) return c.json({ error: "Проверьте цены" }, 400);
    await sql`insert into price_catalog (id, data) values (1, ${JSON.stringify(data.catalog)}::text::jsonb)
      on conflict (id) do update set data = excluded.data, updated_at = now()`;
    return c.json({ ok: true });
  });

  return app;
}
