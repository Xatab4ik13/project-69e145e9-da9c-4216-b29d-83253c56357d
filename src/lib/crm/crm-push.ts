import type { Booking } from "./types";
import { fmtTime } from "./logic";

/** «Подтвердите запись» goes out this many minutes before the start. */
export const REMINDER_LEAD_MIN = 20;

/** An unconfirmed, still scheduled booking for today that starts within the lead time and was not reminded yet. */
export function isReminderDue(
  b: Pick<Booking, "date" | "start" | "confirmed" | "wash"> & { reminded: boolean },
  today: string,
  nowMin: number,
): boolean {
  if (b.reminded || b.confirmed || b.wash !== "scheduled" || b.date !== today) return false;
  const left = b.start - nowMin;
  return left >= 0 && left <= REMINDER_LEAD_MIN;
}

export type PushPayload = { title: string; body: string; url: string; tag: string };

const day = (date: string) => date.split("-").reverse().slice(0, 2).join(".");

export const newBookingPush = (b: Pick<Booking, "id" | "date" | "start" | "car" | "packageName">): PushPayload => ({
  title: "Новая запись",
  body: `${day(b.date)} в ${fmtTime(b.start)} · ${b.car} · ${b.packageName}`,
  url: "/",
  tag: `new-${b.id}`,
});

export const reminderPush = (b: Pick<Booking, "id" | "start" | "car" | "phone">): PushPayload => ({
  title: "Подтвердите запись",
  body: `${fmtTime(b.start)} · ${b.car}${b.phone ? ` · +7${b.phone}` : ""} — позвоните клиенту`,
  url: "/",
  tag: `remind-${b.id}`,
});
