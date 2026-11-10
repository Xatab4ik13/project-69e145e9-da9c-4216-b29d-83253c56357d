import { describe, expect, it } from "vitest";
import { SERVICE_CATALOG, classPriceLabel, sitePriceLabel } from "@/lib/crm/services";

describe("CRM service catalog", () => {
  it("contains every site service with its current class-1 price", () => {
    expect(SERVICE_CATALOG.map((service) => [service.name, sitePriceLabel(service)])).toEqual([
      ["Стандарт", "от 1 200 ₽"],
      ["Комфорт", "от 1 600 ₽"],
      ["Люкс", "от 1 900 ₽"],
      ["Две фазы", "от 500 ₽"],
      ["Три фазы", "от 800 ₽"],
      ["Кварцевый воск", "от 600 ₽"],
      ["Чернение резины", "от 300 ₽"],
      ["Обезжиривание кузова", "от 500 ₽"],
      ["Силикон уплотнителей", "от 300 ₽"],
      ["Антидождь", "от 2 100 ₽"],
      ["Кондиционер кожи", "от 600 ₽"],
      ["Пылесос багажника", "от 300 ₽"],
      ["Химчистка салона", "от 17 000 ₽"],
      ["Мойка двигателя", "2 000 ₽"],
      ["Чистка дисков", "500 ₽ за диск"],
    ]);
  });

  it("keeps the site price tied to class 1 when other classes are added", () => {
    const degreasing = SERVICE_CATALOG.find((service) => service.name === "Обезжиривание кузова")!;
    const withSecondClass = { ...degreasing, classPrices: { 1: 500, 2: 900 } };
    expect(sitePriceLabel(withSecondClass)).toBe("от 500 ₽");
    expect(classPriceLabel(withSecondClass, 2)).toBe("900 ₽");
  });
});
