import type { Booking } from "./types";
import { fmtTime, total } from "./logic";

/** Client reminder goes out this many minutes before the start. */
export const CLIENT_REMINDER_LEAD_MIN = 60;

export type ClientEvent = "created" | "reminder" | "ready" | "cancelled";
export type ClientPush = { title: string; body: string; data: Record<string, string> };

const day = (date: string) => date.split("-").reverse().slice(0, 2).join(".");
const rub = (n: number) => `${n.toLocaleString("ru-RU").replace(/\u00a0/g, " ")} ₽`;

export function clientPush(event: ClientEvent, b: Pick<Booking, "id" | "date" | "start" | "car" | "services" | "bonus">): ClientPush {
  const when = `${day(b.date)} в ${fmtTime(b.start)}`;
  const data = { event, bookingId: b.id };
  switch (event) {
    case "created": return { title: "Вы записаны", body: `${when} · ${b.car}. Ждём вас: Большевиков 18к2, парковка, 4 уровень`, data };
    case "reminder": return { title: "Скоро мойка", body: `Сегодня в ${fmtTime(b.start)} · ${b.car}`, data };
    case "ready": return { title: "Машина готова", body: `${b.car} · к оплате ${rub(total(b))}. Счёт в приложении`, data: { ...data, amount: String(total(b)) } };
    case "cancelled": return { title: "Запись отменена", body: `${when} · ${b.car}`, data };
  }
}

/** Scheduled booking for today starting within the lead time, not reminded yet. */
export function isClientReminderDue(b: Pick<Booking, "date" | "start" | "wash"> & { reminded: boolean }, today: string, nowMin: number): boolean {
  if (b.reminded || b.wash !== "scheduled" || b.date !== today) return false;
  const left = b.start - nowMin;
  return left >= 0 && left <= CLIENT_REMINDER_LEAD_MIN;
}

/** Which client push a CRM status change should send, if any. */
export function eventForChange(prev: Booking["wash"], next: Booking["wash"]): ClientEvent | null {
  if (prev !== next && next === "done") return "ready";
  if (prev !== next && next === "cancelled") return "cancelled";
  return null;
}
