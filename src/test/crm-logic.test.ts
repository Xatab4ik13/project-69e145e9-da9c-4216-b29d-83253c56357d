import { describe, expect, it } from "vitest";
import { applyPayment, findConflict, finishWash, total } from "@/lib/crm/logic";
import { MOCK_BOOKINGS } from "@/lib/crm/mock";

const kia = MOCK_BOOKINGS.find((b) => b.id === "b3")!;

describe("crm logic", () => {
  it("Kia Rio demo order totals 2 500 ₽", () => expect(total(kia)).toBe(2500));
  it("detects overlap in the same box", () => {
    expect(findConflict(MOCK_BOOKINGS, { date: kia.date, box: 1, start: 16 * 60 + 30, duration: 40 })?.id).toBe("b3");
    expect(findConflict(MOCK_BOOKINGS, { date: kia.date, box: 2, start: 17 * 60, duration: 20 })).toBeUndefined();
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

import { fmtPhone, phoneDigits } from "@/lib/crm/logic";
describe("phone", () => {
  it("formats like the site", () => expect(fmtPhone("9045117396")).toBe("+7 (904) 511-73-96"));
  it("accepts 8… and +7… input", () => {
    expect(phoneDigits("89045117396")).toBe("9045117396");
    expect(phoneDigits("+7 (904) 511-73-96")).toBe("9045117396");
    expect(phoneDigits("904")).toBe("904");
  });
});

import { bookingMatches } from "@/lib/crm/logic";
describe("booking identity", () => {
  it("a booking stores no client name", () => {
    expect("client" in kia).toBe(false);
    expect(MOCK_BOOKINGS.every((b) => !("client" in b))).toBe(true);
  });
  it("search finds a booking by car or phone only", () => {
    expect(bookingMatches(kia, "rio")).toBe(true);
    expect(bookingMatches(kia, "960")).toBe(true);
    expect(bookingMatches(kia, "+7 (960) 123")).toBe(true);
    expect(bookingMatches(kia, "")).toBe(true);
    expect(bookingMatches(kia, "Алексей")).toBe(false);
    expect(bookingMatches(kia, "999")).toBe(false);
  });
});

import { autoStart, cancelBooking, confirmBooking, needsCall } from "@/lib/crm/logic";describe("confirmation", () => {
  const lada = MOCK_BOOKINGS.find((b) => b.id === "b4")!; // 17:00, unconfirmed
  it("unconfirmed booking within 15 min needs a call", () => {
    expect(needsCall(lada, lada.date, 16 * 60 + 45)).toBe(true);
    expect(needsCall(lada, lada.date, 16 * 60 + 40)).toBe(false);
  });
  it("unconfirmed never auto-starts; confirmed starts at its time", () => {
    expect(autoStart(lada, lada.date, 17 * 60).wash).toBe("scheduled");
    expect(confirmBooking(lada, lada.date, 16 * 60 + 50).wash).toBe("scheduled");
    expect(confirmBooking(lada, lada.date, 17 * 60).wash).toBe("in_progress");
  });
  it("cancelled booking frees the slot", () => {
    const list = MOCK_BOOKINGS.map((b) => (b.id === "b4" ? cancelBooking(b) : b));
    expect(findConflict(list, { date: lada.date, box: 1, start: 17 * 60, duration: 60 })).toBeUndefined();
  });
});

import { bookingState, STATE_LABEL } from "@/lib/crm/logic";
describe("booking colors", () => {
  const camry = MOCK_BOOKINGS.find((b) => b.id === "b6")!; // 16:00, in progress
  it("unconfirmed within 15 min reads as a red call", () => {
    expect(bookingState(lada, lada.date, 16 * 60 + 50)).toBe("call");
    expect(STATE_LABEL.call).toBe("Позвонить");
    expect(bookingState(lada, lada.date, 16 * 60 + 30)).toBe("unconfirmed");
  });
  it("money still owed is its own state, not the call one", () => {
    expect(bookingState(kia, kia.date, 17 * 60)).toBe("ready");
    expect(bookingState({ ...kia, payment: "awaiting" }, kia.date, 17 * 60)).toBe("awaiting");
    expect(bookingState({ ...kia, payment: "paid" }, kia.date, 17 * 60)).toBe("finished");
  });
  it("a wash under way is working", () => expect(bookingState(camry, camry.date, 16 * 60 + 55)).toBe("working"));
});
