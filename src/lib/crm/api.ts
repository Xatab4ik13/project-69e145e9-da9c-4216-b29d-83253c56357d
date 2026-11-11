import type { Booking, CrmRole } from "./types";
import type { CatalogService } from "./services";

/** Same-origin by default: Caddy forwards /api on every domain to the API service. */
const BASE = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "/api/v1";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      credentials: "include",
      headers: { "content-type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.", 0);
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !data) throw new ApiError(data?.error ?? "Сервер недоступен. Попробуйте позже.", res.status);
  return data;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export type CrmUser = { login: string; role: CrmRole };
export type NewBooking = Pick<Booking, "date" | "box" | "start" | "duration" | "car" | "carType" | "packageName" | "services"> & { phone: string };
export type BookingPatch = Partial<Pick<Booking, "wash" | "confirmed" | "payment">> & { paymentMethod?: Booking["paymentMethod"] | null; washer?: string | null };
export type SiteBooking = { date: string; start: number; car: string; carType: string; phone: string; packageName: string; services: Booking["services"]; extras: string[] };

export type CarHit = { modelId: string; markId: string; name: string };
export type CarInfo = { cls: 1 | 2 | 3 | 4; body: string };
export const carLogoUrl = (markId: string) => `${BASE}/cars/logo/${encodeURIComponent(markId)}`;

export const api = {
  searchCars: (q: string) => request<{ cars: CarHit[] }>(`/cars/search?q=${encodeURIComponent(q)}`).then((r) => r.cars),
  carInfo: (modelId: string) => request<CarInfo>(`/cars/info?model=${encodeURIComponent(modelId)}`),
  login: (login: string, password: string) => request<CrmUser>("/auth/login", json("POST", { login, password })),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => request<CrmUser>("/auth/me"),
  bookings: (from: string, to: string) =>
    request<{ bookings: Booking[] }>(`/crm/bookings?from=${from}&to=${to}`).then((r) => r.bookings),
  createBooking: (b: NewBooking) => request<{ booking: Booking }>("/crm/bookings", json("POST", b)).then((r) => r.booking),
  updateBooking: (id: string, patch: BookingPatch) =>
    request<{ booking: Booking }>(`/crm/bookings/${id}`, json("PATCH", patch)).then((r) => r.booking),
  prices: () => request<{ catalog: CatalogService[] }>("/prices").then((r) => r.catalog),
  savePrices: (catalog: CatalogService[]) => request<{ ok: true }>("/crm/prices", json("PUT", { catalog })),
  slots: (date: string, extras: string[]) =>
    request<{ duration: number; slots: number[] }>(`/slots?date=${date}&extras=${encodeURIComponent(extras.join(","))}`),
  book: (b: SiteBooking) => request<{ id: string; start: number; duration: number }>("/bookings", json("POST", b)),
};

/** Fields the server stores after a status action, so the screen can keep its pure state helpers. */
export const bookingPatch = (b: Booking): BookingPatch => ({
  wash: b.wash, confirmed: b.confirmed, payment: b.payment, paymentMethod: b.paymentMethod ?? null, washer: b.washer ?? null,
});
