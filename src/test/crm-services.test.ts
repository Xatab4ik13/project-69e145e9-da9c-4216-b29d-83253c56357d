import { describe, expect, it } from "vitest";
import {
  CAR_CLASSES, DEFAULT_SERVICE_CATALOG, classMinutes, classPrice, sitePriceLabel, updateServiceCell,
} from "@/lib/crm/services";

const namesAndClassOne = DEFAULT_SERVICE_CATALOG.map((service) => [service.name, classPrice(service, 1), classMinutes(service, 1)]);

describe("CRM service catalog", () => {
  it("contains every site service with its class-1 price and current time", () => {
    expect(namesAndClassOne).toEqual([
      ["Стандарт", 1200, 40],
      ["Комфорт", 1600, 50],
      ["Люкс", 1900, 80],
      ["Двухфазная мойка · доплата к комплексу", 500, 0],
      ["Трёхфазная мойка · доплата к комплексу", 800, 0],
      ["Обезжиривание кузова", 500, 0],
      ["Обработка кварцевым воском", 600, 0],
      ["Антидождь · полусфера стёкол", 2100, 20],
      ["Чернение резины", 300, 0],
      ["Уборка багажника пылесосом", 300, 10],
      ["Очистка кожи салона кондиционером", 600, 10],
      ["Обработка уплотнителей силиконом", 300, 0],
      ["Химчистка салона", 17000, 720],
      ["Мойка двигателя", 2000, 40],
      ["Чистка от нагара и битума · 1 диск", 500, 15],
    ]);
  });

  it("transfers all supplied class II–IV prices without inventing missing ones", () => {
    expect(DEFAULT_SERVICE_CATALOG.map((service) => [service.id, CAR_CLASSES.slice(1).map((classId) => classPrice(service, classId))])).toEqual([
      ["standard", [1400, 1500, 1700]], ["comfort", [1800, 1900, 2100]], ["lux", [2100, 2200, 2500]],
      ["two-phases", [600, 600, 600]], ["three-phases", [900, 1000, 1000]], ["degrease", [700, 900, 900]],
      ["wax", [800, 900, 1100]], ["rain", [2300, 2400, 2500]], ["tire", [400, 500, 500]],
      ["trunk", [400, 400, 400]], ["leather", [700, 800, 900]], ["silicone", [400, 500, 500]],
      ["dry-clean", [null, null, null]], ["engine", [2000, 2000, 2000]], ["wheels", [500, 500, 500]],
    ]);
  });

  it("keeps the site «от» price tied to class 1 when another class changes", () => {
    const changed = updateServiceCell(DEFAULT_SERVICE_CATALOG, "degrease", 2, "price", 750);
    const degreasing = changed.find((service) => service.id === "degrease")!;
    expect(sitePriceLabel(degreasing)).toBe("от 500 ₽");
    expect(classPrice(degreasing, 2)).toBe(750);
  });

  it("edits price and added time independently for the selected class", () => {
    const changed = updateServiceCell(updateServiceCell(DEFAULT_SERVICE_CATALOG, "rain", 3, "price", 2450), "rain", 3, "minutes", 25);
    const antirain = changed.find((service) => service.id === "rain")!;
    expect(classPrice(antirain, 3)).toBe(2450);
    expect(classMinutes(antirain, 3)).toBe(25);
    expect(classPrice(antirain, 1)).toBe(2100);
    expect(classMinutes(antirain, 1)).toBe(20);
  });
});
