import { rub } from "./logic";

export type CarClass = 1 | 2 | 3 | 4;
export const CAR_CLASSES: CarClass[] = [1, 2, 3, 4];

export type ServiceGroup = "Комплексная мойка" | "Дополнительный уход за кузовом" | "Уход за салоном" | "Двигатель и колёса";
export const SERVICE_GROUPS: ServiceGroup[] = ["Комплексная мойка", "Дополнительный уход за кузовом", "Уход за салоном", "Двигатель и колёса"];

export interface ServiceClassValues {
  /** Price in rubles; null means not filled yet. */
  price: number | null;
  /** Duration or added duration in minutes; null means not filled yet. */
  minutes: number | null;
}

export interface CatalogService {
  id: string;
  name: string;
  group: ServiceGroup;
  /** Price and time are per disk when present. */
  unit?: "за диск";
  classes: Record<CarClass, ServiceClassValues>;
}

const values = (price: number | null, minutes: number | null): ServiceClassValues => ({ price, minutes });
const sameTime = (prices: [number, number, number, number], minutes: number): Record<CarClass, ServiceClassValues> => ({
  1: values(prices[0], minutes),
  2: values(prices[1], minutes),
  3: values(prices[2], minutes),
  4: values(prices[3], minutes),
});

/** Initial prices from the supplied price list; class-1 add-on times match the site. */
export const DEFAULT_SERVICE_CATALOG: CatalogService[] = [
  { id: "standard", name: "Стандарт", group: "Комплексная мойка", classes: { 1: values(1200, 40), 2: values(1400, 50), 3: values(1500, 60), 4: values(1700, 60) } },
  { id: "comfort", name: "Комфорт", group: "Комплексная мойка", classes: { 1: values(1600, 50), 2: values(1800, 50), 3: values(1900, 60), 4: values(2100, 60) } },
  { id: "lux", name: "Люкс", group: "Комплексная мойка", classes: { 1: values(1900, 80), 2: values(2100, 80), 3: values(2200, 80), 4: values(2500, 80) } },

  { id: "two-phases", name: "Двухфазная мойка · доплата к комплексу", group: "Дополнительный уход за кузовом", classes: sameTime([500, 600, 600, 600], 0) },
  { id: "three-phases", name: "Трёхфазная мойка · доплата к комплексу", group: "Дополнительный уход за кузовом", classes: sameTime([800, 900, 1000, 1000], 0) },
  { id: "degrease", name: "Обезжиривание кузова", group: "Дополнительный уход за кузовом", classes: sameTime([500, 700, 900, 900], 0) },
  { id: "wax", name: "Обработка кварцевым воском", group: "Дополнительный уход за кузовом", classes: sameTime([600, 800, 900, 1100], 0) },
  { id: "rain", name: "Антидождь · полусфера стёкол", group: "Дополнительный уход за кузовом", classes: sameTime([2100, 2300, 2400, 2500], 20) },
  { id: "tire", name: "Чернение резины", group: "Дополнительный уход за кузовом", classes: sameTime([300, 400, 500, 500], 0) },

  { id: "trunk", name: "Уборка багажника пылесосом", group: "Уход за салоном", classes: sameTime([300, 400, 400, 400], 10) },
  { id: "leather", name: "Очистка кожи салона кондиционером", group: "Уход за салоном", classes: sameTime([600, 700, 800, 900], 10) },
  { id: "silicone", name: "Обработка уплотнителей силиконом", group: "Уход за салоном", classes: sameTime([300, 400, 500, 500], 0) },
  { id: "dry-clean", name: "Химчистка салона", group: "Уход за салоном", classes: { 1: values(17000, 720), 2: values(null, 720), 3: values(null, 720), 4: values(null, 720) } },

  { id: "engine", name: "Мойка двигателя", group: "Двигатель и колёса", classes: sameTime([2000, 2000, 2000, 2000], 40) },
  { id: "wheels", name: "Чистка от нагара и битума · 1 диск", group: "Двигатель и колёса", unit: "за диск", classes: sameTime([500, 500, 500, 500], 15) },
];

export const classPrice = (service: CatalogService, classId: CarClass) => service.classes[classId].price;
export const classMinutes = (service: CatalogService, classId: CarClass) => service.classes[classId].minutes;

const priceLabel = (price: number | null, unit?: string, from = false) =>
  price === null ? "—" : `${from ? "от " : ""}${rub(price)}${unit ? ` ${unit}` : ""}`;

/** The public «от» price always comes from car class 1. */
export const sitePriceLabel = (service: CatalogService) => priceLabel(classPrice(service, 1), service.unit, true);
export const classPriceLabel = (service: CatalogService, classId: CarClass) => priceLabel(classPrice(service, classId), service.unit);

export type ServiceCellField = keyof ServiceClassValues;

/** Pure editor update used by the CRM table. */
export function updateServiceCell(
  catalog: CatalogService[],
  serviceId: string,
  classId: CarClass,
  field: ServiceCellField,
  value: number | null,
): CatalogService[] {
  return catalog.map((service) => service.id === serviceId
    ? { ...service, classes: { ...service.classes, [classId]: { ...service.classes[classId], [field]: value } } }
    : service);
}
