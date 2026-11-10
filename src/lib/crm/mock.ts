import { CLOSE_MIN, OPEN_MIN, addDays, findConflict } from "./logic";
import { WASHERS } from "./finance";
import type { Booking, BookingSource, PaymentMethod } from "./types";

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
  { id: "b1", date: DEMO_TODAY, box: 1, start: h(14), duration: 60, car: "Hyundai Solaris", carType: "Седан", phone: "9213456789", source: "site", packageName: "Комфорт", services: [pkg("Комфорт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "terminal", washer: "Малик" },
  { id: "b2", date: DEMO_TODAY, box: 1, start: h(15), duration: 60, car: "Renault Logan", carType: "Седан", phone: "9112223344", source: "admin", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "cash", washer: "Сергей" },
  { id: "b3", date: DEMO_TODAY, box: 1, start: h(16), duration: 60, car: "Kia Rio", carType: "Седан", phone: "9601234567", source: "app", packageName: "Комфорт", services: [pkg("Комфорт"), { name: "Кварцевый воск", price: 600 }, { name: "Чернение резины", price: 300 }], wash: "done", confirmed: true, payment: "unpaid" },
  { id: "b4", date: DEMO_TODAY, box: 1, start: h(17), duration: 60, car: "Lada Vesta", carType: "Седан", phone: "9045551122", source: "site", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "scheduled", confirmed: false, payment: "unpaid" },
  { id: "b5", date: DEMO_TODAY, box: 2, start: h(14, 30), duration: 60, car: "Skoda Rapid", carType: "Лифтбек", phone: "9998887766", source: "site", packageName: "Комфорт", services: [pkg("Комфорт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "terminal", washer: "Рома" },
  { id: "b6", date: DEMO_TODAY, box: 2, start: h(16), duration: 60, car: "Toyota Camry", carType: "Седан", phone: "9217776655", source: "app", packageName: "Люкс", services: [pkg("Люкс")], wash: "in_progress", confirmed: true, payment: "unpaid" },
  { id: "b7", date: DEMO_TODAY, box: 2, start: h(18), duration: 60, car: "Renault Sandero", carType: "Хэтчбек", phone: "9045112233", source: "admin", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "scheduled", confirmed: false, payment: "unpaid" },
  { id: "b8", date: "2026-11-12", box: 1, start: h(11), duration: 60, car: "Volkswagen Polo", carType: "Седан", phone: "9312223311", source: "app", packageName: "Комфорт", services: [pkg("Комфорт")], wash: "scheduled", confirmed: true, payment: "unpaid" },
  { id: "b9", date: "2026-11-10", box: 2, start: h(12), duration: 60, car: "Kia Ceed", carType: "Хэтчбек", phone: "9501112233", source: "site", packageName: "Стандарт", services: [pkg("Стандарт")], wash: "done", confirmed: true, payment: "paid", paymentMethod: "cash", washer: "Малик" },
];

const HISTORY_CARS: [string, string][] = [
  ["Hyundai Solaris", "Седан"], ["Kia Rio", "Седан"], ["Renault Logan", "Седан"],
  ["Volkswagen Polo", "Седан"], ["Skoda Rapid", "Лифтбек"], ["Lada Vesta", "Седан"],
  ["Toyota Camry", "Седан"], ["Kia Ceed", "Хэтчбек"], ["Renault Sandero", "Хэтчбек"],
  ["Hyundai Creta", "Кроссовер"], ["Volkswagen Tiguan", "Кроссовер"], ["Skoda Octavia", "Лифтбек"],
  ["Nissan X-Trail", "Внедорожник"], ["Toyota RAV4", "Кроссовер"], ["Lada Niva", "Внедорожник"],
  ["Kia Sorento", "Внедорожник"], ["Hyundai H1", "Минивэн"], ["Volkswagen Touareg", "Внедорожник"],
];

/** 110 phones; bookings are drawn with a bias to the first ones — those are the regulars. */
const HISTORY_PHONES = Array.from({ length: 110 }, (_, i) => {
  const a = 10 + ((i * 37) % 90);
  const b = 100 + ((i * 73) % 900);
  const c = 10 + ((i * 17) % 90);
  const d = 10 + ((i * 29) % 90);
  return `9${a}${b}${c}${d}`;
});

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const TIMED_EXTRAS = EXTRAS.filter((e) => e.minutes > 0);
const FLAT_EXTRAS = EXTRAS.filter((e) => e.minutes === 0);

/**
 * Demo month for the owner screens: every day from 2026-10-01 up to the day
 * before DEMO_TODAY, both boxes, paid. Deterministic — tests rely on the totals.
 */
export const HISTORY_BOOKINGS: Booking[] = (() => {
  const r = seeded(20261101);
  const all: Booking[] = [...MOCK_BOOKINGS];
  for (let date = "2026-10-01"; date < DEMO_TODAY; date = addDays(date, 1)) {
    const weekend = [0, 6].includes(new Date(date + "T12:00:00").getDay());
    const count = (weekend ? 13 : 10) + Math.floor(r() * 4);
    for (let i = 0; i < count; i++) {
      const box = (r() < 0.5 ? 1 : 2) as 1 | 2;
      const start = OPEN_MIN + Math.floor(r() * ((CLOSE_MIN - OPEN_MIN) / 30)) * 30;
      const p = PACKAGES[r() < 0.4 ? 0 : r() < 0.6 ? 1 : 2]!;
      const services = [pkg(p.name)];
      let duration = 60;
      if (r() < 0.3) {
        const e = FLAT_EXTRAS[Math.floor(r() * FLAT_EXTRAS.length)]!;
        services.push({ name: e.name, price: e.price });
      }
      if (r() < 0.18) {
        const e = TIMED_EXTRAS[Math.floor(r() * TIMED_EXTRAS.length)]!;
        services.push({ name: e.name, price: e.price });
        duration += e.minutes;
      }
      if (start + duration > CLOSE_MIN) continue;
      if (findConflict(all, { date, box, start, duration })) continue;
      const sr = r();
      const source: BookingSource = sr < 0.3 ? "app" : sr < 0.75 ? "site" : "admin";
      const mr = r();
      const paymentMethod: PaymentMethod =
        source === "app" ? (mr < 0.75 ? "app" : mr < 0.9 ? "terminal" : "cash") : mr < 0.5 ? "terminal" : "cash";
      const phone = HISTORY_PHONES[Math.floor(Math.pow(r(), 1.6) * HISTORY_PHONES.length)]!;
      const [car, carType] = HISTORY_CARS[Number(phone.slice(-3)) % HISTORY_CARS.length]!;
      all.push({
        id: `h-${date}-${i}`,
        date,
        box,
        start,
        duration,
        car,
        carType,
        phone,
        source,
        packageName: p.name,
        services,
        wash: "done",
        confirmed: true,
        payment: paymentMethod === "app" && r() < 0.08 ? "awaiting" : "paid",
        paymentMethod,
        washer: WASHERS[Math.floor(r() * WASHERS.length)],
      });
    }
  }
  return all.filter((b) => b.id.startsWith("h-"));
})();

/** Everything the owner screens add up: demo month plus the live schedule. */
export const ALL_BOOKINGS: Booking[] = [...HISTORY_BOOKINGS, ...MOCK_BOOKINGS];
