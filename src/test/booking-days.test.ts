import { describe, expect, it } from "vitest";
import { bookingDays } from "@/lib/crm/booking-rules";

describe("site booking dates", () => {
  it("offers same-day booking and seven consecutive dates", () => {
    const days = bookingDays(new Date(2026, 10, 11, 19, 11));
    expect(days).toHaveLength(7);
    expect(days.map((day) => [day.getFullYear(), day.getMonth(), day.getDate()])).toEqual([
      [2026, 10, 11],
      [2026, 10, 12],
      [2026, 10, 13],
      [2026, 10, 14],
      [2026, 10, 15],
      [2026, 10, 16],
      [2026, 10, 17],
    ]);
  });
});
