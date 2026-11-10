export type BookingSource = "site" | "app" | "admin";
export type WashStatus = "scheduled" | "in_progress" | "done";
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
  client: string;
  /** 10 digits after +7 */
  phone?: string;
  source: BookingSource;
  worker: string;
  packageName: string;
  services: ServiceLine[];
  wash: WashStatus;
  payment: PaymentStatus;
  paymentMethod?: PaymentMethod;
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
