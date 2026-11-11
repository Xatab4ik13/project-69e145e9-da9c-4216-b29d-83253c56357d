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
