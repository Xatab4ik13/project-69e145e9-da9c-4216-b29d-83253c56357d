import { describe, expect, it } from "vitest";
import {
  ACQUIRING_FEE, SBP_FEE, TAX_RATE, WASHERS, WASHER_SHARE,
  breakevenRevenue, fixedForPeriod, monthlyFixedTotal, repeatVisits, summarize,
} from "@/lib/crm/finance";
import { applyPayment, receivePayment } from "@/lib/crm/logic";
import { HISTORY_BOOKINGS } from "@/lib/crm/mock";
import type { Booking } from "@/lib/crm/types";

const mk = (over: Partial<Booking>): Booking => ({
  id: Math.random().toString(36).slice(2),
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
  paymentMethod: "cash",
  washer: "Рома",
  ...over,
});

const oneDay = { from: "2026-10-05", to: "2026-10-05" };

describe("owner economics constants", () => {
  it("are the numbers the owner gave", () => {
    expect(WASHER_SHARE).toBe(0.3);
    expect(ACQUIRING_FEE).toBe(0.0256);
    expect(SBP_FEE).toBe(0.004);
    expect(TAX_RATE).toBe(0.06);
    expect(monthlyFixedTotal()).toBeCloseTo(251944.5, 2);
    expect(WASHERS).toEqual(["Рома", "Малик", "Сергей"]);
  });

  it("breaks even once revenue covers the fixed plan", () => {
    // 100% - 6% tax - 30% washers = 64% of every rouble left for the plan.
    expect(breakevenRevenue(251944.5, 0)).toBeCloseTo(393663.28, 1);
  });
});

describe("summarize", () => {
  const list = [
    mk({ phone: "9000000001", paymentMethod: "cash", services: [{ name: "a", price: 1000 }] }),
    mk({ phone: "9000000002", paymentMethod: "terminal", services: [{ name: "a", price: 2000 }] }),
    mk({ phone: "9000000003", paymentMethod: "app", services: [{ name: "a", price: 5000 }] }),
  ];
  const s = summarize(list, oneDay, "2026-10-05");

  it("counts revenue and average check of paid visits only", () => {
    expect(s.revenue).toBe(8000);
    expect(s.visits).toBe(3);
    expect(s.avgCheck).toBeCloseTo(8000 / 3, 5);
  });

  it("charges washer share, both commissions and USN 6%", () => {
    expect(s.payroll).toBeCloseTo(2400, 5);
    expect(s.acquiring).toBeCloseTo(51.2, 5);
    expect(s.sbp).toBeCloseTo(20, 5);
    expect(s.tax).toBeCloseTo(480, 5);
  });

  it("prorates the fixed plan over the days of the period", () => {
    expect(s.fixed).toBeCloseTo(251944.5 / 31, 5);
    expect(s.expenses).toBeCloseTo(251944.5 / 31 + 2400 + 51.2 + 20 + 480, 5);
    expect(s.profit).toBeCloseTo(8000 - (251944.5 / 31 + 2400 + 51.2 + 20 + 480), 5);
  });

  it("splits money by payment method and by washer", () => {
    expect(s.methods).toEqual({ cash: 1000, terminal: 2000, app: 5000 });
    expect(s.byWasher["Рома"]).toBe(8000);
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
    const s3 = summarize(list, oneDay, "2026-10-05");
    expect(s3.month.revenue).toBe(8000);
    expect(s3.month.left).toBeCloseTo(s3.month.target - 8000, 5);
    expect(s3.month.left).toBeGreaterThan(0);
  });
});

describe("washer on the booking", () => {
  const done = mk({ payment: "unpaid", paymentMethod: undefined, washer: undefined });

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
  it("adds up whole months", () => {
    expect(fixedForPeriod({ from: "2026-10-01", to: "2026-10-31" })).toBeCloseTo(251944.5, 2);
  });
});
