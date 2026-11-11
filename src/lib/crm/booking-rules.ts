import { bookingDuration } from "./logic";

/** Every complex takes one 60-minute slot; add-ons may add minutes. */
export const SLOT_MIN = 60;

export const PACKAGES = [
  { name: "Стандарт", price: 1200, duration: 60 },
  { name: "Комфорт", price: 1600, duration: 60 },
  { name: "Люкс", price: 1900, duration: 60 },
];

export const EXTRAS = [
  { name: "Кварцевый воск", price: 600, minutes: 0 },
  { name: "Чернение резины", price: 300, minutes: 0 },
  { name: "Обезжиривание кузова", price: 500, minutes: 0 },
  { name: "Силикон уплотнителей", price: 300, minutes: 0 },
  { name: "Антидождь", price: 2100, minutes: 20 },
  { name: "Кондиционер кожи", price: 600, minutes: 10 },
  { name: "Пылесос багажника", price: 300, minutes: 10 },
];

/** Booking length for chosen add-on names; unknown names (e.g. wash phases) add no time. */
export const durationForExtras = (names: string[]) =>
  bookingDuration(SLOT_MIN, names.map((n) => EXTRAS.find((e) => e.name === n)?.minutes ?? 0));

/** Catalog ids for CRM booking items, so prices follow the editable price list per car class. */
export const ITEM_CATALOG_ID: Record<string, string> = {
  "Стандарт": "standard", "Комфорт": "comfort", "Люкс": "lux",
  "Кварцевый воск": "wax", "Чернение резины": "tire", "Обезжиривание кузова": "degrease",
  "Силикон уплотнителей": "silicone", "Антидождь": "rain", "Кондиционер кожи": "leather", "Пылесос багажника": "trunk",
};

/** Price of a package/extra for a car class from the catalog; falls back to the class I list price. */
export function classPrice(
  catalog: { id: string; classes: Record<number, { price: number | null }> }[] | null,
  name: string, cls: 1 | 2 | 3 | 4, fallback: number,
): number {
  const id = ITEM_CATALOG_ID[name];
  return catalog?.find((s) => s.id === id)?.classes[cls]?.price ?? fallback;
}

/** Shortest wash in the price list: a free window shorter than this can never be sold. */
export const MIN_WASH_MIN = 40;

type CatalogLike = { id: string; classes: Record<number, { minutes: number | null }> }[] | null;

/** Reserved minutes = package time for the car class + add-on times for that class (same as shown to the client). */
export function catalogDuration(catalog: CatalogLike, pkgName: string, extraNames: string[], cls: 1 | 2 | 3 | 4): number {
  const mins = (name: string, fallback: number) => {
    const id = ITEM_CATALOG_ID[name];
    return catalog?.find((s) => s.id === id)?.classes[cls]?.minutes ?? fallback;
  };
  const pkg = PACKAGES.find((p) => p.name === pkgName);
  const base = pkg ? mins(pkg.name, SLOT_MIN) : SLOT_MIN;
  return base + extraNames.reduce((a, n) => a + mins(n, EXTRAS.find((e) => e.name === n)?.minutes ?? 0), 0);
}
