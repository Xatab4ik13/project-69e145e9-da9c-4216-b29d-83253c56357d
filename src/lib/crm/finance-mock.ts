import { WASHERS, WASHER_SHARE, addDaysSafe, revenueByWasher, type FinOp } from "./finance";
import { HISTORY_BOOKINGS } from "./mock";

/** Demo payments only — replace with API later. Stable bills of October and early November. */
const BILLS: [string, string, string, number][] = [
  ["2026-10-01", "rent", "Аренда", 97955.5],
  ["2026-10-01", "bank", "Банковское обслуживание", 950],
  ["2026-10-05", "accounting", "Бухгалтерия", 11000],
  ["2026-10-10", "supplies", "Химия и расходники", 15700],
  ["2026-10-22", "supplies", "Химия и расходники", 4300],
  ["2026-10-28", "utilities", "Коммуналка", 25312],
  ["2026-10-31", "employee", "Официальный сотрудник", 27188],
  ["2026-11-01", "rent", "Аренда", 97955.5],
  ["2026-11-01", "bank", "Банковское обслуживание", 950],
  ["2026-11-05", "accounting", "Бухгалтерия", 11000],
  ["2026-11-06", "supplies", "Химия и расходники", 9800],
];

/** Every Monday the washers get 30% of the previous week, rounded down to 100 ₽. */
const PAYDAYS = ["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"];

export const DEMO_OPS: FinOp[] = [
  ...BILLS.map(([date, article, name, amount], i) => ({ id: `demo-bill-${i}`, date, kind: "expense" as const, article, name, amount })),
  ...PAYDAYS.flatMap((day) => {
    const week = revenueByWasher(HISTORY_BOOKINGS, { from: addDaysSafe(day, -7), to: addDaysSafe(day, -1) });
    return WASHERS.map((w) => ({
      id: `demo-pay-${day}-${w}`,
      date: day,
      kind: "payout" as const,
      washer: w,
      name: `Выплата: ${w}`,
      amount: Math.floor(((week[w] ?? 0) * WASHER_SHARE) / 100) * 100,
    }));
  }),
];
