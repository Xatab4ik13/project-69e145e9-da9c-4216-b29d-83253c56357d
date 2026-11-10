import { describe, expect, it } from "vitest";
import { MOCK_BOOKINGS, DEMO_TODAY } from "@/lib/crm/mock";
import { MOCK_LOYALTY_CLIENTS } from "@/lib/crm/loyalty-mock";
import { MOCK_CLIENT_CARS } from "@/lib/crm/clients-mock";
import { buildClients, clientMetrics, filterClients, isInactiveClient } from "@/lib/crm/clients";

const clients = buildClients(MOCK_LOYALTY_CLIENTS, MOCK_BOOKINGS, MOCK_CLIENT_CARS, DEMO_TODAY);

describe("CRM clients", () => {
  it("builds one client per phone and keeps bonus balances in sync", () => {
    expect(clients).toHaveLength(MOCK_LOYALTY_CLIENTS.length);
    expect(new Set(clients.map((client) => client.phone)).size).toBe(clients.length);
    expect(clients.find((client) => client.id === "lc1")?.bonusBalance).toBe(210);
  });

  it("counts repeat clients from two completed visits", () => {
    expect(clientMetrics(clients, DEMO_TODAY).repeat).toBe(4);
    expect(filterClients(clients, "", "repeat", DEMO_TODAY).every((client) => client.visits >= 2)).toBe(true);
  });

  it("filters clients without an activated mobile account", () => {
    const filtered = filterClients(clients, "", "no_app", DEMO_TODAY);
    expect(filtered.map((client) => client.id)).toEqual(["lc2", "lc5", "lc7"]);
  });

  it("treats a client as inactive only after 30 days without a visit", () => {
    expect(isInactiveClient(clients[0]!, "2026-12-11")).toBe(false);
    expect(isInactiveClient(clients[0]!, "2026-12-12")).toBe(true);
    expect(filterClients(clients, "", "inactive", DEMO_TODAY)).toEqual([]);
  });

  it("searches by phone digits and by any car in the garage", () => {
    expect(filterClients(clients, "921 345", "all", DEMO_TODAY).map((client) => client.id)).toEqual(["lc1"]);
    expect(filterClients(clients, "multivan", "all", DEMO_TODAY).map((client) => client.id)).toEqual(["lc6"]);
  });
});
