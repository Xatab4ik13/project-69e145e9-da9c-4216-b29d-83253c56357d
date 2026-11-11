import { describe, expect, it } from "vitest";
import {
  accrualAfterPayment, canRedeem, expiryAfterTwelveMonths, loyaltyBalance,
  maxRedemption, welcomeBonus,
} from "@/lib/crm/loyalty";
import { MOCK_LOYALTY_CLIENTS } from "@/lib/crm/loyalty-mock";

describe("CRM loyalty rules", () => {
  it("accrues 5% from the money-paid part: 2 000 ₽ after a 500-bonus redemption earns 100", () => {
    expect(accrualAfterPayment("paid", 2000)).toBe(100);
  });

  it("accrues only after confirmed payment", () => {
    expect(accrualAfterPayment("unpaid", 2000)).toBe(0);
    expect(accrualAfterPayment("awaiting", 2000)).toBe(0);
    expect(accrualAfterPayment("paid", 2000)).toBe(100);
  });

  it("grants 200 welcome bonuses only after SMS activation", () => {
    expect(welcomeBonus(false)).toBe(0);
    expect(welcomeBonus(true)).toBe(200);
  });

  it("keeps pre-activation 5% accruals on the client's balance", () => {
    const inactive = MOCK_LOYALTY_CLIENTS.find((client) => client.id === "lc2")!;
    expect(inactive.activated).toBe(false);
    expect(loyaltyBalance(inactive, "2026-11-11")).toBe(120);
  });

  it("limits redemption to 20% of the whole check and to the available balance", () => {
    expect(maxRedemption(2500, 800)).toBe(500);
    expect(maxRedemption(2500, 300)).toBe(300);
  });

  it("lets the client choose any positive amount within the redemption limit", () => {
    expect(canRedeem(300, 2500, 800)).toBe(true);
    expect(canRedeem(501, 2500, 800)).toBe(false);
    expect(canRedeem(0, 2500, 800)).toBe(false);
  });

  it("expires each accrual after twelve months", () => {
    expect(expiryAfterTwelveMonths("2026-11-10")).toBe("2027-11-10");
    const client = MOCK_LOYALTY_CLIENTS.find((item) => item.id === "lc6")!;
    expect(loyaltyBalance(client, "2026-11-19")).toBe(295);
    expect(loyaltyBalance(client, "2026-11-20")).toBe(95);
  });

  it("keeps every demo bonus balance non-negative", () => {
    expect(MOCK_LOYALTY_CLIENTS.every((client) => loyaltyBalance(client, "2026-11-11") >= 0)).toBe(true);
  });
});

import { loyaltyFromBookings as fromBookings } from "@/lib/crm/loyalty";
describe("loyalty from real bookings (no app yet)", () => {
  const b = (id: string, phone: string, payment: "paid" | "unpaid", wash = "done") =>
    ({ id, date: "2026-11-10", phone, wash, payment, services: [{ price: 1500 }, { price: 500 }] });
  it("accrues 5% only for paid washes, per phone, without welcome bonus", () => {
    const list = fromBookings([b("1", "+7 921 345-67-89", "paid"), b("2", "9213456789", "unpaid"), b("3", "9213456789", "paid", "cancelled")]);
    expect(list).toHaveLength(1);
    expect(list[0].activated).toBe(false);
    expect(list[0].transactions.map((t) => t.amount)).toEqual([100]);
    expect(list[0].transactions[0].expiresAt).toBe("2027-11-10");
  });
});
