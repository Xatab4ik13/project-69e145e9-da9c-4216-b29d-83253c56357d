import { describe, expect, it } from "vitest";
import { classPrice } from "@/lib/crm/booking-rules";
import { DEFAULT_SERVICE_CATALOG } from "@/lib/crm/services";

describe("CRM booking prices by car class", () => {
  it("Standard for class III costs 1500", () => expect(classPrice(DEFAULT_SERVICE_CATALOG, "Стандарт", 3, 1200)).toBe(1500));
  it("Quartz wax for class IV costs 1100", () => expect(classPrice(DEFAULT_SERVICE_CATALOG, "Кварцевый воск", 4, 600)).toBe(1100));
  it("falls back to class I price without catalog", () => expect(classPrice(null, "Антидождь", 2, 2100)).toBe(2100));
});
