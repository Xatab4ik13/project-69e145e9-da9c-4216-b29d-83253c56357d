import { describe, expect, it } from "vitest";
import { applyPayment, findConflict, finishWash, total } from "@/lib/crm/logic";
import { MOCK_BOOKINGS } from "@/lib/crm/mock";

const kia = MOCK_BOOKINGS.find((b) => b.id === "b3")!;

describe("crm logic", () => {
  it("Kia Rio demo order totals 2 500 ₽", () => expect(total(kia)).toBe(2500));
  it("detects overlap in the same box", () => {
    expect(findConflict(MOCK_BOOKINGS, { date: kia.date, box: 1, start: 16 * 60 + 30, duration: 40 })?.id).toBe("b3");
    expect(findConflict(MOCK_BOOKINGS, { date: kia.date, box: 1, start: 16 * 60 + 50, duration: 20 })).toBeUndefined();
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
