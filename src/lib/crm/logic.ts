import type { Booking, PaymentMethod } from "./types";

export const OPEN_MIN = 10 * 60;
export const CLOSE_MIN = 22 * 60;

export const total = (b: Pick<Booking, "services">) => b.services.reduce((s, l) => s + l.price, 0);

export const fmtTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const rub = (n: number) => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽";

/** Returns a booking in the same box/date that overlaps the given slot, if any. */
export function findConflict(
  list: Booking[],
  slot: Pick<Booking, "date" | "box" | "start" | "duration">,
  ignoreId?: string,
): Booking | undefined {
  return list.find(
    (b) =>
      b.id !== ignoreId &&
      b.date === slot.date &&
      b.box === slot.box &&
      slot.start < b.start + b.duration &&
      b.start < slot.start + slot.duration,
  );
}

export const withinHours = (start: number, duration: number) =>
  start >= OPEN_MIN && start + duration <= CLOSE_MIN;

export function finishWash(b: Booking): Booking {
  return b.wash === "in_progress" ? { ...b, wash: "done" } : b;
}

export function startWash(b: Booking): Booking {
  return b.wash === "scheduled" ? { ...b, wash: "in_progress" } : b;
}

/** Terminal/cash confirm payment; app only issues an invoice (awaiting). */
export function applyPayment(b: Booking, method: PaymentMethod): Booking {
  if (b.wash !== "done" || b.payment === "paid") return b;
  if (method === "app") return { ...b, payment: "awaiting", paymentMethod: "app" };
  return { ...b, payment: "paid", paymentMethod: method };
}

export function statusLabel(b: Booking): string | null {
  if (b.wash === "done" && b.payment === "paid") return "Завершена";
  if (b.wash === "done" && b.payment === "awaiting") return "Ожидает оплаты";
  if (b.wash === "done") return "Готова";
  if (b.wash === "in_progress") return "В работе";
  return null;
}

export const addDays = (iso: string, d: number) => {
  const dt = new Date(iso + "T12:00:00");
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

export const fmtDateLong = (iso: string) => {
  const dt = new Date(iso + "T12:00:00");
  const wd = dt.toLocaleDateString("ru-RU", { weekday: "long" });
  const rest = dt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }).replace(" г.", "");
  return wd.charAt(0).toUpperCase() + wd.slice(1) + ", " + rest;
};

export const fmtDateShort = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

/** Booking length: one base slot plus time-consuming add-ons. */
export const bookingDuration = (slotMin: number, extraMinutes: number[]) =>
  slotMin + extraMinutes.reduce((a, b) => a + b, 0);

/** Free start times (every slot step) with the box the system assigns automatically. */
export function freeSlots(list: Booking[], date: string, duration: number, step = 60): { start: number; box: 1 | 2 }[] {
  const out: { start: number; box: 1 | 2 }[] = [];
  for (let s = OPEN_MIN; s + duration <= CLOSE_MIN; s += step) {
    const box = ([1, 2] as const).find((bx) => !findConflict(list, { date, box: bx, start: s, duration }));
    if (box) out.push({ start: s, box });
  }
  return out;
}

/** App client: one action marks the car ready and issues the in-app invoice (push in future). */
export function readyAndInvoice(b: Booking): Booking {
  if (b.wash !== "in_progress") return b;
  return { ...b, wash: "done", payment: "awaiting", paymentMethod: "app" };
}
