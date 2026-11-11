import type { PaymentStatus } from "./types";

export const LOYALTY = {
  accrualPercent: 5,
  welcomeBonus: 200,
  maxRedemptionPercent: 20,
  validityMonths: 12,
} as const;

export type LoyaltyTransactionType = "accrual" | "welcome" | "redemption";

export interface LoyaltyTransaction {
  id: string;
  type: LoyaltyTransactionType;
  /** Positive for accruals, negative for redemptions. */
  amount: number;
  date: string;
  description: string;
  /** Only accruals expire, twelve months after they are earned. */
  expiresAt?: string;
}

export interface LoyaltyClient {
  id: string;
  /** Ten digits after +7; one phone identifies one account. */
  phone: string;
  activated: boolean;
  activatedAt?: string;
  visits: number;
  totalSpent: number;
  lastVisit: string | null;
  transactions: LoyaltyTransaction[];
}

/** The client earns 5% only from the money actually paid, after payment. */
export function accrualAfterPayment(payment: PaymentStatus, cashPaid: number): number {
  return payment === "paid" ? cashPaid * LOYALTY.accrualPercent / 100 : 0;
}

/** The welcome bonus is granted only after the phone is confirmed by SMS login. */
export function welcomeBonus(activated: boolean): number {
  return activated ? LOYALTY.welcomeBonus : 0;
}

/** Client-selected redemption cannot exceed 20% of the whole check or the balance. */
export function maxRedemption(checkTotal: number, balance: number): number {
  return Math.min(Math.max(0, balance), Math.max(0, checkTotal) * LOYALTY.maxRedemptionPercent / 100);
}

export function canRedeem(amount: number, checkTotal: number, balance: number): boolean {
  return amount > 0 && amount <= maxRedemption(checkTotal, balance);
}

export function expiryAfterTwelveMonths(earnedAt: string): string {
  const date = new Date(`${earnedAt}T12:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function transactionActive(transaction: LoyaltyTransaction, today: string): boolean {
  return !transaction.expiresAt || today < transaction.expiresAt;
}

/** Pre-activation accruals remain on the client's balance and appear after SMS login. */
export function loyaltyBalance(client: LoyaltyClient, today: string): number {
  return client.transactions
    .filter((transaction) => transactionActive(transaction, today))
    .reduce((balance, transaction) => balance + transaction.amount, 0);
}

export function loyaltyMetrics(clients: LoyaltyClient[], today: string) {
  const month = today.slice(0, 7);
  return {
    clients: clients.length,
    activated: clients.filter((client) => client.activated).length,
    balance: clients.reduce((sum, client) => sum + loyaltyBalance(client, today), 0),
    redeemedThisMonth: clients.reduce((sum, client) => sum + client.transactions
      .filter((transaction) => transaction.type === "redemption" && transaction.date.startsWith(month))
      .reduce((monthSum, transaction) => monthSum + Math.abs(transaction.amount), 0), 0),
  };
}

export function formatBonuses(value: number): string {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 2 }).replace(/\u00a0/g, " ");
}

/**
 * Loyalty accounts derived from real bookings while there is no app yet:
 * one account per phone, nobody is activated (no SMS login, no welcome bonus,
 * no redemptions), and each paid wash accrues 5% of its check for 12 months.
 */
export function loyaltyFromBookings(
  bookings: { id: string; date: string; phone: string; wash: string; payment: PaymentStatus; services: { price: number }[] }[],
): LoyaltyClient[] {
  const byPhone = new Map<string, LoyaltyClient>();
  for (const b of bookings) {
    const phone = b.phone.replace(/\D/g, "").slice(-10);
    if (phone.length !== 10 || b.wash === "cancelled" || b.payment !== "paid") continue;
    const paid = b.services.reduce((s, l) => s + l.price, 0);
    const client = byPhone.get(phone) ?? { id: phone, phone, activated: false, visits: 0, totalSpent: 0, lastVisit: null, transactions: [] };
    client.visits += 1;
    client.totalSpent += paid;
    if (!client.lastVisit || b.date > client.lastVisit) client.lastVisit = b.date;
    const amount = accrualAfterPayment(b.payment, paid);
    if (amount > 0) client.transactions.push({
      id: b.id, type: "accrual", amount, date: b.date,
      description: `5% с оплаты мойки · ${paid.toLocaleString("ru-RU").replace(/\u00a0/g, " ")} ₽`,
      expiresAt: expiryAfterTwelveMonths(b.date),
    });
    byPhone.set(phone, client);
  }
  return [...byPhone.values()].sort((a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""));
}
