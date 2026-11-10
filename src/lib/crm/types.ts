export type BookingSource = "site" | "app" | "admin";
export type WashStatus = "scheduled" | "in_progress" | "done" | "cancelled";
export type PaymentStatus = "unpaid" | "awaiting" | "paid";
export type PaymentMethod = "terminal" | "cash" | "app";

export interface ServiceLine {
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  box: 1 | 2;
  /** minutes from 00:00 */
  start: number;
  duration: number;
  car: string;
  carType: string;
  /** 10 digits after +7 */
  phone?: string;
  source: BookingSource;
  packageName: string;
  services: ServiceLine[];
  wash: WashStatus;
  /** Client confirmed the visit (call before start for site/admin bookings). */
  confirmed: boolean;
  payment: PaymentStatus;
  paymentMethod?: PaymentMethod;
  /** Washer who took the order — chosen when the money is accepted. */
  washer?: string;
}

export const SOURCE_LABEL: Record<BookingSource, string> = {
  site: "Сайт",
  app: "Приложение",
  admin: "Администратор",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  terminal: "Терминал",
  cash: "Наличные",
  app: "В приложении",
};

/** Who is looking at the CRM: the manager runs the day, the owner also sees the money. */
export type CrmRole = "admin" | "owner";
