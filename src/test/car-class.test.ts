import { describe, expect, it } from "vitest";
import { carClass } from "@/lib/crm/car-class";

describe("класс автомобиля", () => {
  it("седан и хэтчбек — I", () => {
    expect(carClass("SEDAN", 4400)).toBe(1);
    expect(carClass("HATCHBACK_5_DOORS", 4100)).toBe(1);
  });
  it("кроссовер короче 4800 мм — II", () => expect(carClass("ALLROAD_5_DOORS", 4799)).toBe(2));
  it("кроссовер от 4800 мм включительно — III", () => {
    expect(carClass("ALLROAD_5_DOORS", 4800)).toBe(3);
    expect(carClass("ALLROAD_5_DOORS", 4922)).toBe(3);
  });
  it("минивэн — IV", () => {
    expect(carClass("MINIVAN", 5100)).toBe(4);
    expect(carClass("COMPACTVAN", 4400)).toBe(4);
  });
});
