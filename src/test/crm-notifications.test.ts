import { describe, expect, it } from "vitest";
import { isReminderDue, REMINDER_LEAD_MIN } from "@/lib/crm/crm-push";

const b = (over: Partial<Parameters<typeof isReminderDue>[0]> = {}) =>
  ({ date: "2026-11-11", start: 12 * 60, confirmed: false, wash: "scheduled" as const, reminded: false, ...over });

describe("«Подтвердите запись» за 20 минут", () => {
  it("lead time is 20 minutes", () => expect(REMINDER_LEAD_MIN).toBe(20));
  it("due exactly 20 minutes before the start", () => expect(isReminderDue(b(), "2026-11-11", 11 * 60 + 40)).toBe(true));
  it("not yet 21 minutes before", () => expect(isReminderDue(b(), "2026-11-11", 11 * 60 + 39)).toBe(false));
  it("skips confirmed bookings", () => expect(isReminderDue(b({ confirmed: true }), "2026-11-11", 11 * 60 + 50)).toBe(false));
  it("skips already reminded bookings", () => expect(isReminderDue(b({ reminded: true }), "2026-11-11", 11 * 60 + 50)).toBe(false));
  it("skips cancelled bookings", () => expect(isReminderDue(b({ wash: "cancelled" }), "2026-11-11", 11 * 60 + 50)).toBe(false));
  it("skips other days", () => expect(isReminderDue(b({ date: "2026-11-12" }), "2026-11-11", 11 * 60 + 50)).toBe(false));
});
