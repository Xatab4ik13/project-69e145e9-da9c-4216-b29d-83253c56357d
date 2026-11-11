import type { Booking } from "./types";
import { CLOSE_MIN, OPEN_MIN, addDays } from "./logic";
import { SLOT_MIN } from "./mock";

export interface FreeInterval {
  start: number;
  end: number;
}

export interface WeekDaySummary {
  date: string;
  isToday: boolean;
  isPast: boolean;
  bookingCount: number;
  occupiedMinutes: number;
  free: Record<1 | 2, FreeInterval[]>;
}

/** Monday is the first day of the CRM week. */
export function startOfWeek(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

export function weekDates(anchor: string): string[] {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function freeIntervals(dayBookings: Booking[], box: 1 | 2, date: string, today: string, nowMin: number): FreeInterval[] {
  let cursor = date === today
    ? Math.max(OPEN_MIN, Math.ceil(nowMin / SLOT_MIN) * SLOT_MIN)
    : OPEN_MIN;
  const intervals: FreeInterval[] = [];
  const sorted = dayBookings
    .filter((booking) => booking.box === box)
    .sort((a, b) => a.start - b.start);

  for (const booking of sorted) {
    const start = Math.max(OPEN_MIN, booking.start);
    const end = Math.min(CLOSE_MIN, booking.start + booking.duration);
    if (end <= cursor) continue;
    if (start - cursor >= SLOT_MIN) intervals.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (CLOSE_MIN - cursor >= SLOT_MIN) intervals.push({ start: cursor, end: CLOSE_MIN });
  return intervals;
}

/** A compact week overview; cancelled orders neither count nor occupy a box. */
export function summarizeWeek(list: Booking[], anchor: string, today: string, nowMin: number): WeekDaySummary[] {
  return weekDates(anchor).map((date) => {
    const dayBookings = list.filter((booking) => booking.date === date && booking.wash !== "cancelled");
    const isPast = date < today;
    return {
      date,
      isToday: date === today,
      isPast,
      bookingCount: dayBookings.length,
      occupiedMinutes: dayBookings.reduce((sum, booking) => sum + booking.duration, 0),
      free: {
        1: isPast ? [] : freeIntervals(dayBookings, 1, date, today, nowMin),
        2: isPast ? [] : freeIntervals(dayBookings, 2, date, today, nowMin),
      },
    };
  });
}
