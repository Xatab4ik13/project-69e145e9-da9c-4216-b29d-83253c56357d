import type { Booking } from "./types";

/** Every complex takes one 60-minute slot; add-ons may add minutes. */
export const SLOT_MIN = 60;

/** Demo data only — replace with API later. */
export const DEMO_TODAY = "2026-11-11";
export const DEMO_NOW_MIN = 16 * 60 + 55;

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

const h = (hh: number, mm = 0) => hh * 60 + mm;
const pkg = (n: string) => {
  const p = PACKAGES.find((x) => x.name === n)!;
  return { name: `Комплекс «${p.name}»`, price: p.price };
};

export const MOCK_BOOKINGS: Booking[] = [
  { id: "b1", date: DEMO_TODAY, box: 1, start: h(14), duration: 60, car: "Hyundai Solaris", carType: "Седан", phone: "9213456789", source: "site", packageName: "Комфорт", services: [pkg("Комфорт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "terminal" },
  { id: "b2", date: DEMO_TODAY, box: 1, start: h(15), duration: 60, car: "Renault Logan", carType: "Седан", phone: "9112223344", source: "admin", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "cash" },
  { id: "b3", date: DEMO_TODAY, box: 1, start: h(16), duration: 60, car: "Kia Rio", carType: "Седан", phone: "9601234567", source: "app", packageName: "Комфорт", services: [pkg("Комфорт"), { name: "Кварцевый воск", price: 600 }, { name: "Чернение резины", price: 300 }], wash: "done", confirmed: true, payment: "unpaid" },
  { id: "b4", date: DEMO_TODAY, box: 1, start: h(17), duration: 60, car: "Lada Vesta", carType: "Седан", phone: "9045551122", source: "site", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "scheduled", confirmed: false, payment: "unpaid" },
  { id: "b5", date: DEMO_TODAY, box: 2, start: h(14, 30), duration: 60, car: "Skoda Rapid", carType: "Лифтбек", phone: "9998887766", source: "site", packageName: "Комфорт", services: [pkg("Комфорт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "terminal" },
  { id: "b6", date: DEMO_TODAY, box: 2, start: h(16), duration: 60, car: "Toyota Camry", carType: "Седан", phone: "9217776655", source: "app", packageName: "Люкс", services: [pkg("Люкс")], wash: "in_progress", confirmed: true, payment: "unpaid" },
  { id: "b7", date: DEMO_TODAY, box: 2, start: h(18), duration: 60, car: "Renault Sandero", carType: "Хэтчбек", phone: "9045112233", source: "admin", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "scheduled", confirmed: false, payment: "unpaid" },
  { id: "b8", date: "2026-11-12", box: 1, start: h(11), duration: 60, car: "Volkswagen Polo", carType: "Седан", phone: "9312223311", source: "app", packageName: "Комфорт", services: [pkg("Комфорт")], wash: "scheduled", confirmed: true, payment: "unpaid" },
  { id: "b9", date: "2026-11-10", box: 2, start: h(12), duration: 60, car: "Kia Ceed", carType: "Хэтчбек", phone: "9501112233", source: "site", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "cash" },
];
