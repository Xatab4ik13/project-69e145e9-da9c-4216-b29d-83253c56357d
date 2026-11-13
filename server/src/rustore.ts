import type { SQL } from "bun";
import { washNow } from "../../src/lib/crm/clock";
import { clientPush, isClientReminderDue, type ClientEvent } from "../../src/lib/crm/client-push";
import type { Booking } from "../../src/lib/crm/types";

const PROJECT = process.env.RUSTORE_PROJECT_ID ?? "";
const TOKEN = process.env.RUSTORE_SERVICE_TOKEN ?? "";
export const rustoreEnabled = Boolean(PROJECT && TOKEN);

/** Sends one RuStore push to every device of the phone; dead tokens are dropped. */
export async function notifyClient(sql: SQL, event: ClientEvent, b: Pick<Booking, "id" | "date" | "start" | "car" | "services" | "bonus" | "phone">) {
  const phone = (b.phone ?? "").replace(/\D/g, "").slice(-10);
  if (!rustoreEnabled || phone.length !== 10) return;
  const tokens = (await sql`select token from client_push_tokens where phone = ${phone}`) as { token: string }[];
  const msg = clientPush(event, b);
  await Promise.all(tokens.map(async ({ token }) => {
    const res = await fetch(`https://vkpns.rustore.ru/v1/projects/${PROJECT}/messages:send`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ message: { token, notification: { title: msg.title, body: msg.body }, data: msg.data, android: { ttl: "3600s" } } }),
    }).catch((e) => { console.error("rustore", e); return null; });
    if (!res || res.ok) return;
    const text = await res.text();
    if (res.status === 404 || /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/.test(text)) await sql`delete from client_push_tokens where token = ${token}`;
    else console.error("rustore failed", res.status, text);
  }));
}

/** Runs every minute: «Скоро мойка» to app clients before today's bookings. */
export async function runClientReminders(sql: SQL, at: Date = new Date()) {
  if (!rustoreEnabled) return;
  const { today, nowMin } = washNow(at);
  const rows = (await sql`select b.id, b.date, b.start_min, b.wash, b.car, b.phone, b.services, b.bonus from bookings b
    where b.date = ${today} and b.client_reminder_sent_at is null and b.wash = 'scheduled'
      and exists (select 1 from client_push_tokens t where t.phone = right(regexp_replace(b.phone, '\\D', '', 'g'), 10))`) as {
    id: string; date: string; start_min: number; wash: "scheduled"; car: string; phone: string; services: Booking["services"] | string; bonus: number;
  }[];
  for (const r of rows) {
    if (!isClientReminderDue({ date: r.date, start: r.start_min, wash: r.wash, reminded: false }, today, nowMin)) continue;
    const [claimed] = await sql`update bookings set client_reminder_sent_at = now() where id = ${r.id} and client_reminder_sent_at is null returning id`;
    if (claimed) await notifyClient(sql, "reminder", { id: r.id, date: r.date, start: r.start_min, car: r.car, phone: r.phone, bonus: r.bonus,
      services: typeof r.services === "string" ? JSON.parse(r.services) : r.services });
  }
}
