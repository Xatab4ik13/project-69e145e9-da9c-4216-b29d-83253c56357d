import { rub } from "./logic";
import { EXTRAS, PACKAGES } from "./mock";

export type ServiceCategory = "Комплексы" | "Способ мойки" | "Добавьте уход" | "Больше ухода";

export interface CatalogService {
  name: string;
  category: ServiceCategory;
  /** Whether the site shows «от» before this service's price. */
  siteFrom: boolean;
  /** For example, «за диск». */
  unit?: string;
  /** Current and future prices by car class; the site's base price is class 1. */
  classPrices: Readonly<Record<number, number | undefined>>;
}

export const SERVICE_CATALOG: CatalogService[] = [
  ...PACKAGES.map((p): CatalogService => ({
    name: p.name,
    category: "Комплексы",
    siteFrom: true,
    classPrices: { 1: p.price },
  })),
  { name: "Две фазы", category: "Способ мойки", siteFrom: true, classPrices: { 1: 500 } },
  { name: "Три фазы", category: "Способ мойки", siteFrom: true, classPrices: { 1: 800 } },
  ...EXTRAS.map((e): CatalogService => ({
    name: e.name,
    category: "Добавьте уход",
    siteFrom: true,
    classPrices: { 1: e.price },
  })),
  { name: "Химчистка салона", category: "Больше ухода", siteFrom: true, classPrices: { 1: 17000 } },
  { name: "Мойка двигателя", category: "Больше ухода", siteFrom: false, classPrices: { 1: 2000 } },
  { name: "Чистка дисков", category: "Больше ухода", siteFrom: false, unit: "за диск", classPrices: { 1: 500 } },
];

export const classPrice = (service: CatalogService, classId: number) => service.classPrices[classId];

const priceLabel = (price: number | undefined, unit?: string, from = false) =>
  price === undefined ? "—" : `${from ? "от " : ""}${rub(price)}${unit ? ` ${unit}` : ""}`;

/** The public «от» price always comes from car class 1. */
export const sitePriceLabel = (service: CatalogService) =>
  priceLabel(classPrice(service, 1), service.unit, service.siteFrom);

export const classPriceLabel = (service: CatalogService, classId: number) =>
  priceLabel(classPrice(service, classId), service.unit);
