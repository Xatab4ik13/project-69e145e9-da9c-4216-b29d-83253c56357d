import type { Booking } from "./types";
import { fmtTime, total } from "./logic";
import type { LoyaltyClient } from "./loyalty";
import { loyaltyBalance } from "./loyalty";
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
  const status: ClientVisitStatus = booking.wash === "done"
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
): CrmClient[] {
  return accounts.map((account) => {
    const history = bookings
      .filter((booking) => booking.phone === account.phone)
      .map(visitFromBooking)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    const bookingDates = bookings.filter((booking) => booking.phone === account.phone).map((booking) => booking.date);
    const firstContact = [account.activatedAt ?? today, ...bookingDates].sort()[0] ?? today;
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

export function carClassRoman(carClass: CarClass): string {
  return (["", "I", "II", "III", "IV"] as const)[carClass];
}

export function carTypeForClass(carClass: CarClass): string {
  return (["", "Седан / хэтчбек", "Небольшой кроссовер", "Внедорожник", "Минивэн"] as const)[carClass];
}
