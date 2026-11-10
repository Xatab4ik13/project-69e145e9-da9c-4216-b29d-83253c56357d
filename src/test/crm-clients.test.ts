import { describe, expect, it } from "vitest";
import { MOCK_BOOKINGS, DEMO_TODAY } from "@/lib/crm/mock";
import { MOCK_LOYALTY_CLIENTS } from "@/lib/crm/loyalty-mock";
import { MOCK_CLIENT_CARS } from "@/lib/crm/clients-mock";
import { buildClients, CLIENTS_PER_PAGE, clientMetrics, filterClients, isInactiveClient, paginateClients, paginationPageNumbers } from "@/lib/crm/clients";

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

  it("shows no more than eight clients per page and keeps the requested page in range", () => {
    expect(CLIENTS_PER_PAGE).toBe(8);
    const manyClients = Array.from({ length: 19 }, (_, index) => ({
      ...clients[index % clients.length]!,
      id: `client-${index + 1}`,
    }));
    const firstPage = paginateClients(manyClients, 1);
    expect(firstPage.items).toHaveLength(8);
    expect(firstPage.pageCount).toBe(3);
    expect(firstPage.start).toBe(1);
    expect(firstPage.end).toBe(8);
    expect(paginateClients(manyClients, 3).items).toHaveLength(3);
    expect(paginateClients(manyClients, 99).currentPage).toBe(3);
  });

  it("shows five page numbers and moves to the next group after page five", () => {
    expect(paginationPageNumbers(1, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationPageNumbers(5, 12)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationPageNumbers(6, 12)).toEqual([6, 7, 8, 9, 10]);
    expect(paginationPageNumbers(12, 12)).toEqual([11, 12, 13, 14, 15]);
  });

  it("paginates only after searching the complete client list", () => {
    const manyClients = Array.from({ length: 12 }, (_, index) => ({
      ...clients[index % clients.length]!,
      id: `client-${index + 1}`,
    }));
    const found = filterClients(manyClients, "multivan", "all", DEMO_TODAY);
    const result = paginateClients(found, 4);
    expect(found.length).toBeGreaterThan(0);
    expect(result.currentPage).toBe(1);
    expect(result.items.every((client) => client.cars.some((car) => car.name === "Volkswagen Multivan"))).toBe(true);
  });
});
