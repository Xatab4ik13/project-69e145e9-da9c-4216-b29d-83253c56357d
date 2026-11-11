import { describe, expect, it } from "vitest";
import { audienceClients, expiringBonuses, pushError } from "@/lib/crm/notifications";
import type { LoyaltyClient } from "@/lib/crm/loyalty";

const c = (id: string, activated: boolean, expiresAt: string): LoyaltyClient => ({
  id, phone: "9000000000", activated, visits: 1, totalSpent: 0, lastVisit: null,
  transactions: [{ id: id + "t", type: "accrual", amount: 100, date: "2025-12-01", description: "", expiresAt }],
});
const today = "2026-11-11";

describe("push audience", () => {
  it("sends only to clients with the app", () => {
    expect(audienceClients([c("a", true, "2027-05-01"), c("b", false, "2027-05-01")], "all", today).map((x) => x.id)).toEqual(["a"]);
  });
  it("expiring = bonuses burning within 30 days", () => {
    expect(expiringBonuses(c("a", true, "2026-12-01"), today)).toBe(100);
    expect(expiringBonuses(c("a", true, "2026-12-20"), today)).toBe(0);
  });
  it("requires title and text", () => {
    expect(pushError("", "x")).not.toBeNull();
    expect(pushError("Акция", "Текст")).toBeNull();
  });
});
