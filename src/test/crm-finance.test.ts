import { describe, expect, it } from "vitest";
import {
  ACQUIRING_FEE, SBP_FEE, TAX_RATE, WASHERS, WASHER_SHARE,
  articleStatus, breakevenRevenue, fixedForPeriod, washerLedger, type FinOp, monthlyFixedTotal, repeatVisits, summarize,
} from "@/lib/crm/finance";
import { applyPayment, receivePayment } from "@/lib/crm/logic";
import { HISTORY_BOOKINGS } from "@/lib/crm/mock";
import type { Booking } from "@/lib/crm/types";

/** A paid cash order; payment method and washer are added only where a test needs them. */
const base: Booking = {
  id: "base",
  date: "2026-10-05",
  box: 1,
  start: 12 * 60,
  duration: 60,
  car: "Kia Rio",
  carType: "Седан",
  phone: "9000000000",
  source: "site",
  packageName: "Стандарт",
  services: [{ name: "Комплекс «Стандарт»", price: 1200 }],
  wash: "done",
  confirmed: true,
  payment: "paid",
};

let counter = 0;
const mk = (over: Partial<Booking>): Booking => ({ ...base, id: `b${++counter}`, ...over });

const oneDay = { from: "2026-10-05", to: "2026-10-05" };

describe("owner economics constants", () => {
  it("are the numbers the owner gave", () => {
    expect(WASHER_SHARE).toBe(0.3);
    expect(ACQUIRING_FEE).toBe(0.0256);
    expect(SBP_FEE).toBe(0.004);
    expect(TAX_RATE).toBe(0.06);
    expect(monthlyFixedTotal()).toBeCloseTo(109905.5, 2);
    expect(WASHERS).toEqual(["Рома", "Малик", "Сергей"]);
  });

  it("breaks even once revenue covers the fixed plan", () => {
    // 100% - 6% tax - 30% washers = 64% of every rouble left for the plan.
    expect(breakevenRevenue(109905.5, 0)).toBeCloseTo(109905.5 / 0.64, 1);
  });
});

describe("summarize", () => {
  const list = [
    mk({ phone: "9000000001", paymentMethod: "cash", washer: "Рома", services: [{ name: "a", price: 1000 }] }),
    mk({ phone: "9000000002", paymentMethod: "terminal", washer: "Малик", services: [{ name: "a", price: 2000 }] }),
    mk({ phone: "9000000003", paymentMethod: "app", washer: "Сергей", services: [{ name: "a", price: 5000 }] }),
  ];
  const s = summarize(list, oneDay, "2026-10-05");

  it("counts revenue and average check of paid visits only", () => {
    expect(s.revenue).toBe(8000);
    expect(s.visits).toBe(3);
    expect(s.avgCheck).toBeCloseTo(8000 / 3, 5);
  });

  it("charges washer share and both commissions", () => {
    expect(s.payroll).toBeCloseTo(2400, 5);
    expect(s.acquiring).toBeCloseTo(51.2, 5);
    expect(s.sbp).toBeCloseTo(20, 5);
  });

  it("charges USN 6% on terminal and app payments, but not on cash", () => {
    expect(s.tax).toBeCloseTo((2000 + 5000) * 0.06, 5);
    expect(summarize([list[0]!], oneDay, "2026-10-05").tax).toBe(0);
  });

  it("uses a zero tax rate for cash in the breakeven calculation", () => {
    const cashOnly = summarize([list[0]!], oneDay, "2026-10-05");
    expect(cashOnly.month.target).toBeCloseTo(109905.5 / 0.7, 5);
  });

  it("a mid-month day carries no stable articles", () => {
    expect(s.fixed).toBe(0);
    expect(s.profit).toBeCloseTo(8000 - (2400 + 51.2 + 20 + 420), 5);
  });

  it("splits money by payment method and by washer", () => {
    expect(s.methods).toEqual({ cash: 1000, terminal: 2000, app: 5000 });
    expect(s.byWasher).toEqual({ "Рома": 1000, "Малик": 2000, "Сергей": 5000 });
  });

  it("measures box load against 12 working hours", () => {
    expect(s.load.box1).toBeCloseTo(180 / 720, 5);
    expect(s.load.box2).toBe(0);
    expect(s.load.overall).toBeCloseTo(0.125, 5);
  });

  it("ignores unpaid and cancelled bookings", () => {
    const mixed = [...list, mk({ payment: "unpaid" }), mk({ wash: "cancelled", payment: "unpaid" })];
    const m = summarize(mixed, oneDay, "2026-10-05");
    expect(m.visits).toBe(3);
    expect(m.revenue).toBe(8000);
  });

  it("treats a phone that paid earlier as a repeat visit", () => {
    const withHistory = [...list, mk({ date: "2026-10-04", phone: "9000000001" })];
    const s2 = summarize(withHistory, oneDay, "2026-10-05");
    expect(s2.repeat.repeat).toBe(1);
    expect(s2.repeat.share).toBeCloseTo(1 / 3, 5);
    expect(repeatVisits(list, oneDay).repeat).toBe(0);
  });

  it("shows how much revenue is still missing this month", () => {
    expect(s.month.revenue).toBe(8000);
    expect(s.month.left).toBeCloseTo(s.month.target - 8000, 5);
    expect(s.month.left).toBeGreaterThan(0);
  });
});

describe("washer on the booking", () => {
  /** Car washed, money not taken yet: neither method nor washer chosen. */
  const done = mk({ payment: "unpaid" });

  it("terminal and cash store the chosen washer", () => {
    expect(applyPayment(done, "terminal", "Малик")).toMatchObject({ payment: "paid", washer: "Малик" });
    expect(applyPayment(done, "cash", "Сергей")).toMatchObject({ payment: "paid", washer: "Сергей" });
  });

  it("app invoice stays awaiting until the money arrives", () => {
    const invoiced = applyPayment(done, "app");
    expect(invoiced.payment).toBe("awaiting");
    expect(receivePayment(invoiced, "Рома")).toMatchObject({ payment: "paid", washer: "Рома" });
  });

  it("the demo month assigns a washer to every paid order", () => {
    const missing = HISTORY_BOOKINGS.filter((b) => b.payment === "paid" && !b.washer);
    expect(missing).toHaveLength(0);
    expect(HISTORY_BOOKINGS.length).toBeGreaterThan(200);
  });
});

describe("fixedForPeriod", () => {
  it("books the whole month plan on the 1st", () => {
    expect(fixedForPeriod({ from: "2026-10-01", to: "2026-10-01" })).toBeCloseTo(109905.5, 2);
    expect(fixedForPeriod({ from: "2026-10-02", to: "2026-10-31" })).toBe(0);
  });

  it("uses the owner's plan for the month and a bigger actual bill", () => {
    const overrides = { "2026-12": { rent: 100000 } };
    const ops: FinOp[] = [{ id: "a", date: "2026-12-10", kind: "expense", article: "accounting", name: "Бухгалтерия", amount: 15000 }];
    expect(fixedForPeriod({ from: "2026-12-01", to: "2026-12-01" }, ops, overrides)).toBeCloseTo(100000 + 15000 + 950, 2);
  });

  it("utilities and supplies count only when paid, on the bill date", () => {
    const ops: FinOp[] = [{ id: "u", date: "2026-10-28", kind: "expense", article: "utilities", name: "Коммуналка", amount: 25000 }];
    expect(fixedForPeriod({ from: "2026-10-01", to: "2026-10-27" }, ops)).toBeCloseTo(109905.5, 2);
    expect(fixedForPeriod({ from: "2026-10-28", to: "2026-10-28" }, ops)).toBe(25000);
  });

  it("one-off expenses land on their own date", () => {
    const ops: FinOp[] = [{ id: "o", date: "2026-10-15", kind: "expense", article: "other", name: "Ремонт", amount: 5000 }];
    expect(fixedForPeriod({ from: "2026-10-15", to: "2026-10-15" }, ops)).toBe(5000);
  });

  it("shows what is paid and what is still due per article", () => {
    const ops: FinOp[] = [{ id: "r", date: "2026-10-02", kind: "expense", article: "rent", name: "Аренда", amount: 50000 }];
    const rent = articleStatus("2026-10", ops).find((r) => r.id === "rent")!;
    expect(rent).toMatchObject({ plan: 97955.5, paid: 50000, left: 47955.5 });
  });
});

describe("washerLedger", () => {
  it("debt = 30% of all his paid orders minus payouts", () => {
    const list = [mk({ washer: "Рома", services: [{ name: "a", price: 10000 }] })];
    const ops: FinOp[] = [{ id: "p", date: "2026-10-05", kind: "payout", washer: "Рома", name: "Выплата", amount: 1000 }];
    const roma = washerLedger(list, ops, oneDay, "2026-10-05").find((r) => r.washer === "Рома")!;
    expect(roma).toMatchObject({ earned: 3000, paid: 1000, owed: 2000 });
  });
});
