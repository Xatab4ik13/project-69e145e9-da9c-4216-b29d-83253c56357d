import webpush from "web-push";
import type { SQL } from "bun";
import { washNow } from "../../src/lib/crm/clock";
import { isReminderDue, reminderPush, type PushPayload } from "../../src/lib/crm/crm-push";

const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@aquariuswash.ru";
export const pushEnabled = Boolean(PUBLIC && PRIVATE);
if (pushEnabled) webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
export const vapidPublicKey = () => PUBLIC;

/** Sends to every subscribed device of both roles; dead subscriptions are dropped. */
export async function notifyAll(sql: SQL, payload: PushPayload) {
  if (!pushEnabled) return;
  const subs = (await sql`select endpoint, p256dh, auth from push_subscriptions`) as { endpoint: string; p256dh: string; auth: string }[];
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 600, urgency: "high" });
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sql`delete from push_subscriptions where endpoint = ${s.endpoint}`;
      else console.error("push failed", code, (e as { body?: string }).body ?? e);
    }
  }));
}

/** Runs every minute: «Подтвердите запись» 20 minutes before an unconfirmed booking. */
export async function runReminders(sql: SQL, at: Date = new Date()) {
  const { today, nowMin } = washNow(at);
  const rows = (await sql`select id, date, start_min, confirmed, wash, car, phone, reminder_sent_at from bookings
    where date = ${today} and reminder_sent_at is null and not confirmed and wash = 'scheduled'`) as {
    id: string; date: string; start_min: number; confirmed: boolean; wash: "scheduled"; car: string; phone: string; reminder_sent_at: null;
  }[];
  for (const r of rows) {
    if (!isReminderDue({ date: r.date, start: r.start_min, confirmed: r.confirmed, wash: r.wash, reminded: false }, today, nowMin)) continue;
    const [claimed] = await sql`update bookings set reminder_sent_at = now() where id = ${r.id} and reminder_sent_at is null returning id`;
    if (claimed) await notifyAll(sql, reminderPush({ id: r.id, start: r.start_min, car: r.car, phone: r.phone || undefined }));
  }
}
