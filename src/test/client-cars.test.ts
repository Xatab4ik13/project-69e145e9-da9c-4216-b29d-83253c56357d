import { describe, expect, it } from "vitest";
import { carToEvict, MAX_CLIENT_CARS } from "@/lib/crm/client-cars";

const five = ["A", "B", "C", "D", "E"].map((car, i) => ({ car, lastUsed: `2026-11-0${i + 1}T10:00:00Z` }));

describe("машины клиента", () => {
  it("хранится не больше 5 машин", () => expect(MAX_CLIENT_CARS).toBe(5));
  it("пока машин меньше 5, ничего не удаляется", () => expect(carToEvict(five.slice(0, 4), "F")).toBeNull());
  it("шестая машина заменяет самую давнюю", () => expect(carToEvict([five[2]!, five[0]!, five[4]!, five[1]!, five[3]!], "F")).toBe("A"));
  it("уже сохранённая машина ничего не вытесняет", () => expect(carToEvict(five, "C")).toBeNull());
});
