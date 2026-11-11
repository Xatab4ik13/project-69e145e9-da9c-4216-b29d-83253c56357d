import { loyaltyBalance, type LoyaltyClient } from "./loyalty";

/** Owner-only push notifications to clients of the mobile app; sending is mocked until the app exists. */
export type PushAudience = "all" | "expiring";
export type AutoPushId = "car_ready" | "booking_reminder" | "bonus_accrued";

export const PUSH_LIMITS = { title: 50, body: 150, expiringDays: 30 } as const;

export const AUDIENCE_LABEL: Record<PushAudience, string> = {
  all: "Всем с приложением",
  expiring: "Бонусы скоро сгорят",
};

export const AUTO_PUSHES: { id: AutoPushId; title: string; text: string }[] = [
  { id: "car_ready", title: "Машина готова", text: "Ваш автомобиль готов, можно забирать." },
  { id: "booking_reminder", title: "Напоминание о записи", text: "Напоминаем: сегодня у вас запись на мойку." },
  { id: "bonus_accrued", title: "Начислены бонусы", text: "Вам начислены бонусы за оплату мойки." },
];

export interface SentPush {
  id: string;
  date: string;
  audience: PushAudience;
  title: string;
  body: string;
  recipients: number;
}

const plusDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Bonuses (still on balance) that expire within the next 30 days. */
export function expiringBonuses(client: LoyaltyClient, today: string): number {
  const limit = plusDays(today, PUSH_LIMITS.expiringDays);
  const soon = client.transactions
    .filter((t) => t.expiresAt && t.expiresAt > today && t.expiresAt <= limit)
    .reduce((s, t) => s + t.amount, 0);
  return Math.min(soon, loyaltyBalance(client, today));
}

/** Only clients who logged into the app can receive a push. */
export function audienceClients(clients: LoyaltyClient[], audience: PushAudience, today: string): LoyaltyClient[] {
  const app = clients.filter((c) => c.activated);
  return audience === "all" ? app : app.filter((c) => expiringBonuses(c, today) > 0);
}

export function pushError(title: string, body: string): string | null {
  if (!title.trim()) return "Укажите заголовок";
  if (!body.trim()) return "Укажите текст";
  if (title.length > PUSH_LIMITS.title) return `Заголовок до ${PUSH_LIMITS.title} символов`;
  if (body.length > PUSH_LIMITS.body) return `Текст до ${PUSH_LIMITS.body} символов`;
  return null;
}
