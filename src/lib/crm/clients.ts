import type { Booking } from "./types";
import { fmtTime, total } from "./logic";
import type { LoyaltyClient } from "./loyalty";
import { loyaltyBalance, loyaltyFromBookings } from "./loyalty";
import { carClass } from "./car-class";
import type { CarClass } from "./services";

export type ClientFilter = "all" | "new" | "repeat" | "no_app" | "inactive";

export interface ClientCar {
  id: string;
  name: string;
  carClass: CarClass;
  primary: boolean;
}

export type ClientVisitStatus = "completed" | "upcoming" | "in_progress" | "cancelled";

export interface ClientVisit {
  id: string;
  date: string;
  time: string;
  car: string;
  packageName: string;
  services: string[];
  total: number;
  paymentLabel: string;
  status: ClientVisitStatus;
}

export interface CrmClient {
  id: string;
  phone: string;
  firstContact: string;
  activated: boolean;
  visits: number;
  totalSpent: number;
  lastVisit: string | null;
  bonusBalance: number;
  cars: ClientCar[];
  history: ClientVisit[];
}

const PAYMENT_LABELS = { cash: "Наличные", terminal: "Терминал", app: "Приложение" } as const;

function visitFromBooking(booking: Booking): ClientVisit {
  const status: ClientVisitStatus = booking.wash === "cancelled" ? "cancelled" : booking.wash === "done"
    ? "completed"
    : booking.wash === "in_progress"
      ? "in_progress"
      : "upcoming";
  return {
    id: booking.id,
    date: booking.date,
    time: `${fmtTime(booking.start)}–${fmtTime(booking.start + booking.duration)}`,
    car: booking.car,
    packageName: booking.packageName,
    services: booking.services.slice(1).map((service) => service.name),
    total: total(booking),
    paymentLabel: booking.payment === "paid" && booking.paymentMethod
      ? PAYMENT_LABELS[booking.paymentMethod]
      : booking.payment === "awaiting" ? "Ожидает оплаты" : "Не оплачена",
    status,
  };
}

export function buildClients(
  accounts: LoyaltyClient[],
  bookings: Booking[],
  carsByClient: Record<string, ClientCar[]>,
  today: string,
  firstContactByClient: Record<string, string> = {},
): CrmClient[] {
  return accounts.map((account) => {
    const history = bookings
      .filter((booking) => booking.phone === account.phone)
      .map(visitFromBooking)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    const bookingDates = bookings.filter((booking) => booking.phone === account.phone).map((booking) => booking.date);
    const firstContact = firstContactByClient[account.id]
      ?? [account.activatedAt ?? today, ...bookingDates].sort()[0]
      ?? today;
    return {
      id: account.id,
      phone: account.phone,
      firstContact,
      activated: account.activated,
      visits: account.visits,
      totalSpent: account.totalSpent,
      lastVisit: account.lastVisit,
      bonusBalance: loyaltyBalance(account, today),
      cars: carsByClient[account.id] ?? [],
      history,
    };
  });
}

export function clientMetrics(clients: CrmClient[], today: string) {
  return {
    total: clients.length,
    newThisMonth: clients.filter((client) => client.firstContact.slice(0, 7) === today.slice(0, 7)).length,
    repeat: clients.filter((client) => client.visits >= 2).length,
    activated: clients.filter((client) => client.activated).length,
  };
}

export function isInactiveClient(client: CrmClient, today: string): boolean {
  if (!client.lastVisit) return false;
  const days = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${client.lastVisit}T00:00:00Z`)) / 86_400_000;
  return days > 30;
}

export function filterClients(
  clients: CrmClient[],
  query: string,
  filter: ClientFilter,
  today: string,
): CrmClient[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const digits = query.replace(/\D/g, "").replace(/^8/, "").slice(0, 10);
  return clients.filter((client) => {
    const matchesQuery = !normalizedQuery
      || (digits.length > 0 && client.phone.includes(digits))
      || client.cars.some((car) => car.name.toLocaleLowerCase("ru").includes(normalizedQuery));
    const matchesFilter = filter === "all"
      || (filter === "new" && client.firstContact.slice(0, 7) === today.slice(0, 7))
      || (filter === "repeat" && client.visits >= 2)
      || (filter === "no_app" && !client.activated)
      || (filter === "inactive" && isInactiveClient(client, today));
    return matchesQuery && matchesFilter;
  });
}

export const CLIENTS_PER_PAGE = 8;

export function paginateClients<T>(clients: T[], requestedPage: number) {
  const pageCount = Math.max(1, Math.ceil(clients.length / CLIENTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, requestedPage), pageCount);
  const offset = (currentPage - 1) * CLIENTS_PER_PAGE;
  return {
    items: clients.slice(offset, offset + CLIENTS_PER_PAGE),
    pageCount,
    currentPage,
    start: clients.length === 0 ? 0 : offset + 1,
    end: Math.min(offset + CLIENTS_PER_PAGE, clients.length),
  };
}

export function paginationPageNumbers(currentPage: number, _pageCount: number): number[] {
  const firstPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
  return Array.from({ length: 5 }, (_, index) => firstPage + index);
}

export function carClassRoman(carClass: CarClass): string {
  return (["", "I", "II", "III", "IV"] as const)[carClass];
}

export function carTypeForClass(carClass: CarClass): string {
  return (["", "Седан / хэтчбек", "Небольшой кроссовер", "Внедорожник", "Минивэн"] as const)[carClass];
}

function classFromCarType(carType: string): CarClass {
  const t = carType.toLocaleLowerCase("ru");
  if (/минив|микроав/.test(t)) return 4;
  if (/внедорож/.test(t)) return 3;
  if (/кроссов/.test(t)) return 2;
  return carClass(carType, null);
}

/** Real CRM clients: one per phone from all bookings; bonuses from paid washes only. */
export function clientsFromBookings(bookings: Booking[], today: string): CrmClient[] {
  const withPhone = bookings
    .map((b) => ({ ...b, phone: (b.phone ?? "").replace(/\D/g, "").slice(-10) }))
    .filter((b) => b.phone.length === 10);
  const accounts = new Map(loyaltyFromBookings(withPhone).map((a) => [a.phone, a]));
  const phones = [...new Set(withPhone.map((b) => b.phone))];
  const all: LoyaltyClient[] = phones.map((phone) => accounts.get(phone)
    ?? { id: phone, phone, activated: false, visits: 0, totalSpent: 0, lastVisit: null, transactions: [] });
  const cars: Record<string, ClientCar[]> = {};
  const first: Record<string, string> = {};
  for (const b of [...withPhone].sort((a, c) => `${c.date}${c.start}`.localeCompare(`${a.date}${a.start}`))) {
    const list = (cars[b.phone] ??= []);
    const name = b.car.trim();
    if (name && !list.some((c) => c.name.toLocaleLowerCase("ru") === name.toLocaleLowerCase("ru"))) {
      list.push({ id: `${b.phone}-${list.length}`, name, carClass: classFromCarType(b.carType ?? ""), primary: list.length === 0 });
    }
    first[b.phone] = b.date;
  }
  return buildClients(all, withPhone, cars, today, first)
    .sort((a, b) => `${b.history[0]?.date ?? ""}`.localeCompare(`${a.history[0]?.date ?? ""}`));
}
