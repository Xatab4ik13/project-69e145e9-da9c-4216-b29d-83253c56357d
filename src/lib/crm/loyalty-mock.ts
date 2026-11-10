import type { LoyaltyClient } from "./loyalty";

/** Demo loyalty accounts and ledger entries; replace with API data later. */
export const MOCK_LOYALTY_CLIENTS: LoyaltyClient[] = [
  {
    id: "lc1", phone: "9213456789", activated: true, activatedAt: "2026-09-12", visits: 8, totalSpent: 15400, lastVisit: "2026-11-11",
    transactions: [
      { id: "lt1", type: "accrual", amount: 80, date: "2026-11-11", description: "5% с оплаты мойки · 1 600 ₽", expiresAt: "2027-11-11" },
      { id: "lt2", type: "redemption", amount: -150, date: "2026-11-03", description: "Оплата части мойки бонусами" },
      { id: "lt3", type: "accrual", amount: 80, date: "2026-11-03", description: "5% с денежной части чека · 1 600 ₽", expiresAt: "2027-11-03" },
      { id: "lt4", type: "welcome", amount: 200, date: "2026-09-12", description: "Приветственные бонусы за вход по SMS", expiresAt: "2027-09-12" },
    ],
  },
  {
    id: "lc2", phone: "9112223344", activated: false, visits: 3, totalSpent: 4200, lastVisit: "2026-11-11",
    transactions: [
      { id: "lt5", type: "accrual", amount: 60, date: "2026-11-11", description: "5% с оплаты мойки · 1 200 ₽", expiresAt: "2027-11-11" },
      { id: "lt6", type: "accrual", amount: 60, date: "2026-10-24", description: "5% с оплаты мойки · 1 200 ₽", expiresAt: "2027-10-24" },
    ],
  },
  {
    id: "lc3", phone: "9601234567", activated: true, activatedAt: "2026-08-19", visits: 12, totalSpent: 28700, lastVisit: "2026-11-08",
    transactions: [
      { id: "lt7", type: "accrual", amount: 100, date: "2026-11-08", description: "5% с денежной части чека · 2 000 ₽", expiresAt: "2027-11-08" },
      { id: "lt8", type: "redemption", amount: -500, date: "2026-11-08", description: "20% чека · выбор клиента" },
      { id: "lt8a", type: "accrual", amount: 300, date: "2026-10-28", description: "5% с оплаты мойки · 6 000 ₽", expiresAt: "2027-10-28" },
      { id: "lt9", type: "welcome", amount: 200, date: "2026-08-19", description: "Приветственные бонусы за вход по SMS", expiresAt: "2027-08-19" },
    ],
  },
  {
    id: "lc4", phone: "9998887766", activated: true, activatedAt: "2026-11-11", visits: 1, totalSpent: 1600, lastVisit: "2026-11-11",
    transactions: [
      { id: "lt10", type: "welcome", amount: 200, date: "2026-11-11", description: "Приветственные бонусы за вход по SMS", expiresAt: "2027-11-11" },
      { id: "lt11", type: "accrual", amount: 80, date: "2026-11-11", description: "5% с оплаты мойки · 1 600 ₽", expiresAt: "2027-11-11" },
    ],
  },
  {
    id: "lc5", phone: "9045551122", activated: false, visits: 0, totalSpent: 0, lastVisit: null,
    transactions: [],
  },
  {
    id: "lc6", phone: "9217776655", activated: true, activatedAt: "2025-11-20", visits: 5, totalSpent: 9600, lastVisit: "2026-11-09",
    transactions: [
      { id: "lt12", type: "accrual", amount: 95, date: "2026-11-09", description: "5% с оплаты мойки · 1 900 ₽", expiresAt: "2027-11-09" },
      { id: "lt13", type: "welcome", amount: 200, date: "2025-11-20", description: "Приветственные бонусы за вход по SMS", expiresAt: "2026-11-20" },
    ],
  },
];
