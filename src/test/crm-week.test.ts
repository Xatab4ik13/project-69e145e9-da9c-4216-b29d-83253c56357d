import { describe, expect, it } from "vitest";
import { startOfWeek, summarizeWeek, weekDates } from "@/lib/crm/week";
import type { Booking } from "@/lib/crm/types";

let id = 0;
const booking = (over: Partial<Booking>): Booking => ({
  id: `week-${++id}`,
  date: "2026-11-12",
  box: 1,
  start: 10 * 60,
  duration: 120,
  car: "Kia Rio",
  carType: "Седан",
  source: "site",
  packageName: "Стандарт",
  services: [{ name: "Мойка", price: 1200 }],
  wash: "done",
  confirmed: true,
  payment: "paid",
  ...over,
});

describe("Неделя в расписании", () => {
  it("начинается с понедельника и содержит семь дней", () => {
    expect(startOfWeek("2026-11-11")).toBe("2026-11-09");
    expect(startOfWeek("2026-11-15")).toBe("2026-11-09");
    expect(weekDates("2026-11-11")).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15",
    ]);
  });

  it("считает записи, занятое время и свободные интервалы каждого бокса", () => {
    const list = [
      booking({ start: 10 * 60, duration: 120 }),
      booking({ id: "second", box: 2, start: 12 * 60, duration: 60 }),
      booking({ id: "cancelled", wash: "cancelled", start: 14 * 60, duration: 60 }),
    ];
    const day = summarizeWeek(list, "2026-11-12", "2026-11-11", 16 * 40).find((item) => item.date === "2026-11-12")!;

    expect(day.bookingCount).toBe(2);
    expect(day.occupiedMinutes).toBe(180);
    expect(day.free[1]).toEqual([{ start: 12 * 60, end: 22 * 60 }]);
    expect(day.free[2]).toEqual([{ start: 10 * 60, end: 12 * 60 }, { start: 13 * 60, end: 22 * 60 }]);
  });

  it("не предлагает прошедшие дни и прошедшее время сегодня для записи", () => {
    const list = [booking({ date: "2026-11-11", start: 18 * 60, duration: 60 })];
    const days = summarizeWeek(list, "2026-11-11", "2026-11-11", 16 * 40);
    const past = days.find((day) => day.date === "2026-11-10")!;
    const current = days.find((day) => day.date === "2026-11-11")!;

    expect(past.free[1]).toEqual([]);
    expect(current.free[1]).toEqual([{ start: 16 * 60 + 40, end: 18 * 60 }, { start: 19 * 60, end: 22 * 60 }]);
  });
});
