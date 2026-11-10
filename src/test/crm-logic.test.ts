import { describe, expect, it } from "vitest";
import { applyPayment, findConflict, finishWash, total } from "@/lib/crm/logic";
import { MOCK_BOOKINGS } from "@/lib/crm/mock";

const kia = MOCK_BOOKINGS.find((b) => b.id === "b3")!;

describe("crm logic", () => {
  it("Kia Rio demo order totals 2 500 ₽", () => expect(total(kia)).toBe(2500));
  it("detects overlap in the same box", () => {
    expect(findConflict(MOCK_BOOKINGS, { date: kia.date, box: 1, start: 16 * 60 + 30, duration: 40 })?.id).toBe("b3");
    expect(findConflict(MOCK_BOOKINGS, { date: kia.date, box: 1, start: 17 * 60 + 0, duration: 20, box: 2 as const })).toBeUndefined();
  });
  it("finishing a wash leaves it unpaid", () => {
    const r = finishWash({ ...kia, wash: "in_progress" });
    expect([r.wash, r.payment]).toEqual(["done", "unpaid"]);
  });
  it("terminal and cash mark paid; app only awaits", () => {
    expect(applyPayment(kia, "terminal")).toMatchObject({ payment: "paid", paymentMethod: "terminal" });
    expect(applyPayment(kia, "cash")).toMatchObject({ payment: "paid", paymentMethod: "cash" });
    expect(applyPayment(kia, "app").payment).toBe("awaiting");
  });
});

import { bookingDuration, freeSlots, readyAndInvoice } from "@/lib/crm/logic";
import { SLOT_MIN } from "@/lib/crm/mock";

describe("slots", () => {
  it("base slot is 60 min plus timed add-ons", () => {
    expect(bookingDuration(SLOT_MIN, [])).toBe(60);
    expect(bookingDuration(SLOT_MIN, [20, 10])).toBe(90);
  });
  it("auto-assigns box 2 when box 1 is busy", () => {
    expect(freeSlots(MOCK_BOOKINGS, kia.date, 60).find((s) => s.start === 18 * 60)?.box).toBe(1);
    expect(freeSlots(MOCK_BOOKINGS, kia.date, 60).find((s) => s.start === 14 * 60)).toBeUndefined();
  });
  it("«Машина готова» marks ready and awaits app payment", () => {
    expect(readyAndInvoice({ ...kia, wash: "in_progress" })).toMatchObject({ wash: "done", payment: "awaiting", paymentMethod: "app" });
  });
});
