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

import { bookingDuration, customServiceDetails, freeSlots, isPastSlot, readyAndInvoice, smartSlots, OPEN_MIN as OPEN, CLOSE_MIN as CLOSE } from "@/lib/crm/logic";
import { catalogDuration } from "@/lib/crm/booking-rules";
import { DEFAULT_SERVICE_CATALOG } from "@/lib/crm/services";
import { DEMO_NOW_MIN, DEMO_TODAY, SLOT_MIN } from "@/lib/crm/mock";

describe("slots", () => {
  it("base slot is 60 min plus timed add-ons", () => {
    expect(bookingDuration(SLOT_MIN, [])).toBe(60);
    expect(bookingDuration(SLOT_MIN, [20, 10])).toBe(90);
  });
  it("custom service uses its own name, price and exact duration", () => {
    expect(customServiceDetails("  Полная химчистка салона и багажника  ", 4500, 135)).toEqual({
      packageName: "Свои услуги",
      services: [{ name: "Полная химчистка салона и багажника", price: 4500 }],
      duration: 135,
    });
  });
  it("auto-assigns box 2 when box 1 is busy", () => {
    expect(freeSlots(MOCK_BOOKINGS, kia.date, 60).find((s) => s.start === 18 * 60)?.box).toBe(1);
    expect(freeSlots(MOCK_BOOKINGS, kia.date, 60).find((s) => s.start === 14 * 60)).toBeUndefined();
  });
  it("does not offer slots before the current-time line or on past dates", () => {
    const todaySlots = freeSlots([], DEMO_TODAY, 60, 60, DEMO_TODAY, DEMO_NOW_MIN);
    expect(todaySlots[0]?.start).toBe(17 * 60);
    expect(todaySlots.every((slot) => !isPastSlot(DEMO_TODAY, slot.start, DEMO_TODAY, DEMO_NOW_MIN))).toBe(true);
    expect(isPastSlot(DEMO_TODAY, 16 * 60, DEMO_TODAY, DEMO_NOW_MIN)).toBe(true);
    expect(isPastSlot(DEMO_TODAY, DEMO_NOW_MIN, DEMO_TODAY, DEMO_NOW_MIN)).toBe(false);
    expect(freeSlots([], "2026-11-10", 60, 60, DEMO_TODAY, DEMO_NOW_MIN)).toEqual([]);
    expect(freeSlots([], "2026-11-12", 60, 60, DEMO_TODAY, DEMO_NOW_MIN)[0]?.start).toBe(10 * 60);
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
  it("a booking stores no client name or worker", () => {
    expect("client" in kia).toBe(false);
    expect("worker" in kia).toBe(false);
    expect(MOCK_BOOKINGS.every((b) => !("client" in b) && !("worker" in b))).toBe(true);
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
  const lada = MOCK_BOOKINGS.find((b) => b.id === "b4")!; // 17:00, unconfirmed
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

import { EXTRAS } from "@/lib/crm/mock";
describe("body care extras", () => {
  it("body degreasing costs from 500 ₽ and adds no time", () => {
    expect(EXTRAS.find((e) => e.name === "Обезжиривание кузова")).toMatchObject({ price: 500, minutes: 0 });
  });
  it("silicone seal care costs from 300 ₽ and adds no time", () => {
    expect(EXTRAS.find((e) => e.name === "Силикон уплотнителей")).toMatchObject({ price: 300, minutes: 0 });
  });
});

describe("умные слоты записи", () => {
  const busy = (start: number, duration: number, box: 1 | 2 = 1) =>
    ({ id: `b${start}${box}`, date: "2026-12-01", box, start, duration, wash: "scheduled" }) as unknown as Parameters<typeof smartSlots>[0][number];
  it("после записи 12:15 на 40 минут бокс свободен с 12:55", () => {
    const both = [busy(12 * 60 + 15, 40), busy(OPEN, CLOSE - OPEN, 2)];
    expect(smartSlots(both, "2026-12-01", 40).some((s) => s.start === 12 * 60 + 55 && s.box === 1)).toBe(true);
  });
  it("шаг начала — 15 минут", () => {
    expect(smartSlots([], "2026-12-01", 40).slice(0, 3).map((s) => s.start)).toEqual([600, 615, 630]);
  });
  it("прячет время, после которого остаётся окно короче 40 минут", () => {
    const list = [busy(12 * 60, 60), busy(OPEN, CLOSE - OPEN, 2)];
    // 13:15 оставит дыру 15 минут после 13:00
    expect(smartSlots(list, "2026-12-01", 40).some((s) => s.start === 13 * 60 + 15)).toBe(false);
    expect(smartSlots(list, "2026-12-01", 40).some((s) => s.start === 13 * 60)).toBe(true);
  });
  it("резерв = время комплекса по классу + допуслуги", () => {
    expect(catalogDuration(DEFAULT_SERVICE_CATALOG, "Стандарт", [], 1)).toBe(40);
    expect(catalogDuration(DEFAULT_SERVICE_CATALOG, "Люкс", ["Антидождь"], 3)).toBe(100);
  });
});
