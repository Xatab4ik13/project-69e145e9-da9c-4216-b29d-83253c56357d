import type { Booking } from "./types";
import { CLOSE_MIN, OPEN_MIN, addDays, total } from "./logic";

/** Three washers; each gets 30% of the revenue of his own orders. */
export const WASHERS = ["Рома", "Малик", "Сергей"] as const;
export type Washer = (typeof WASHERS)[number];

export const WASHER_SHARE = 0.3;
/** Т-Банк acquiring on card payments taken on the terminal. */
export const ACQUIRING_FEE = 0.0256;
/** СБП Т-Банка on payments made inside the app (owner confirmed 0,4%). */
export const SBP_FEE = 0.004;
/** УСН «доходы» — 6% of the whole revenue. */
export const TAX_RATE = 0.06;

export interface ExpenseItem {
  id: string;
  name: string;
  monthly: number;
  /** When the money leaves: whole sum on the 1st, whole sum on the last day, or spread daily. */
  pay: "start" | "end" | "daily";
}

/** Planned monthly costs. The director edits this list on the Финансы screen. */
export const MONTHLY_EXPENSES: ExpenseItem[] = [
  { id: "rent", name: "Аренда", monthly: 167955.5, pay: "start" },
  { id: "utilities", name: "Коммуналка", monthly: 24851, pay: "end" },
  { id: "employee", name: "Официальный сотрудник", monthly: 27188, pay: "daily" },
  { id: "accounting", name: "Бухгалтерия", monthly: 11000, pay: "daily" },
  { id: "bank", name: "Банковское обслуживание", monthly: 950, pay: "daily" },
  { id: "supplies", name: "Химия и расходники", monthly: 20000, pay: "daily" },
  /** Sublease income received in cash reduces the real rent cost. */
  { id: "sublease", name: "Субаренда (доход, наличные)", monthly: -70000, pay: "start" },
  /** УСН 6% is also due on the sublease income. */
  { id: "sublease_tax", name: "Налог 6% с субаренды", monthly: 4200, pay: "start" },
];

export const monthlyFixedTotal = (items: ExpenseItem[] = MONTHLY_EXPENSES) =>
  items.reduce((s, i) => s + i.monthly, 0);

export interface Period {
  from: string;
  to: string;
}

export const inPeriod = (b: Booking, p: Period) => b.date >= p.from && b.date <= p.to;

export const dateRange = (from: string, to: string): string[] => {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
};

export const daysInMonth = (iso: string) =>
  new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), 0)).getUTCDate();

/** What one article costs on a given day, by its payment moment. */
export const itemOnDay = (i: ExpenseItem, d: string) => {
  const day = Number(d.slice(8, 10));
  if (i.pay === "start") return day === 1 ? i.monthly : 0;
  if (i.pay === "end") return day === daysInMonth(d) ? i.monthly : 0;
  return i.monthly / daysInMonth(d);
};

/** Fixed costs actually paid within the period. */
export const fixedForPeriod = (p: Period, items: ExpenseItem[] = MONTHLY_EXPENSES) =>
  dateRange(p.from, p.to).reduce((s, d) => s + items.reduce((a, i) => a + itemOnDay(i, d), 0), 0);

/** The same fixed costs split by article, prorated over the period. */
export function fixedRowsForPeriod(p: Period, items: ExpenseItem[] = MONTHLY_EXPENSES) {
  const days = dateRange(p.from, p.to);
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    value: days.reduce((s, d) => s + itemOnDay(i, d), 0),
  }));
}

export const paidIn = (list: Booking[], p: Period) =>
  list.filter((b) => inPeriod(b, p) && b.payment === "paid");

export const revenueOf = (list: Booking[]) => list.reduce((s, b) => s + total(b), 0);

export interface MethodTotals {
  cash: number;
  terminal: number;
  app: number;
}

export function byMethod(list: Booking[], p: Period): MethodTotals {
  const out: MethodTotals = { cash: 0, terminal: 0, app: 0 };
  for (const b of paidIn(list, p)) if (b.paymentMethod) out[b.paymentMethod] += total(b);
  return out;
}

export function revenueByWasher(list: Booking[], p: Period): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of paidIn(list, p)) {
    const w = b.washer ?? "Не указан";
    out[w] = (out[w] ?? 0) + total(b);
  }
  return out;
}

/** Paid visits in the period made by a phone that already paid here earlier. */
export function repeatVisits(list: Booking[], p: Period) {
  const paid = paidIn(list, p);
  const repeat = paid.filter((b) =>
    !!b.phone &&
    list.some(
      (x) =>
        x.payment === "paid" &&
        x.phone === b.phone &&
        (x.date < b.date || (x.date === b.date && x.start < b.start)),
    ),
  ).length;
  return { repeat, visits: paid.length, share: paid.length ? repeat / paid.length : 0 };
}

/** Share of the working time of both boxes that was occupied. */
export function boxLoad(list: Booking[], p: Period) {
  const days = dateRange(p.from, p.to).length || 1;
  const available = (CLOSE_MIN - OPEN_MIN) * days;
  const load = (box: 1 | 2) => {
    const busy = list
      .filter((b) => b.box === box && b.wash !== "cancelled" && inPeriod(b, p))
      .reduce((s, b) => s + b.duration, 0);
    return available ? Math.min(1, busy / available) : 0;
  };
  const box1 = load(1);
  const box2 = load(2);
  return { box1, box2, overall: (box1 + box2) / 2, days };
}

/** Revenue that covers the fixed plan: after tax, washer share and payment fees. */
export function breakevenRevenue(monthFixed: number, feeRate: number) {
  const contribution = 1 - TAX_RATE - WASHER_SHARE - feeRate;
  return contribution > 0 ? monthFixed / contribution : Number.POSITIVE_INFINITY;
}

export interface FinanceSummary {
  period: Period;
  revenue: number;
  visits: number;
  avgCheck: number;
  fixed: number;
  payroll: number;
  acquiring: number;
  sbp: number;
  tax: number;
  expenses: number;
  profit: number;
  methods: MethodTotals;
  byWasher: Record<string, number>;
  repeat: { repeat: number; visits: number; share: number };
  load: { box1: number; box2: number; overall: number; days: number };
  days: { date: string; revenue: number }[];
  month: {
    from: string;
    to: string;
    revenue: number;
    fixed: number;
    target: number;
    left: number;
    progress: number;
  };
}

export function summarize(list: Booking[], p: Period, today: string): FinanceSummary {
  const paid = paidIn(list, p);
  const revenue = revenueOf(paid);
  const methods = byMethod(list, p);
  const payroll = revenue * WASHER_SHARE;
  const acquiring = methods.terminal * ACQUIRING_FEE;
  const sbp = methods.app * SBP_FEE;
  const tax = revenue * TAX_RATE;
  const fixed = fixedForPeriod(p);
  const expenses = fixed + payroll + acquiring + sbp + tax;

  const monthPeriod: Period = { from: `${today.slice(0, 7)}-01`, to: today };
  const monthPaid = paidIn(list, monthPeriod);
  const monthRevenue = revenueOf(monthPaid);
  const monthMethods = byMethod(list, monthPeriod);
  const monthFees = monthMethods.terminal * ACQUIRING_FEE + monthMethods.app * SBP_FEE;
  const feeRate = monthRevenue ? monthFees / monthRevenue : 0;
  const monthFixed = monthlyFixedTotal();
  const target = breakevenRevenue(monthFixed, feeRate);

  return {
    period: p,
    revenue,
    visits: paid.length,
    avgCheck: paid.length ? revenue / paid.length : 0,
    fixed,
    payroll,
    acquiring,
    sbp,
    tax,
    expenses,
    profit: revenue - expenses,
    methods,
    byWasher: revenueByWasher(list, p),
    repeat: repeatVisits(list, p),
    load: boxLoad(list, p),
    days: dateRange(p.from, p.to).map((date) => ({
      date,
      revenue: revenueOf(paid.filter((b) => b.date === date)),
    })),
    month: {
      from: monthPeriod.from,
      to: monthPeriod.to,
      revenue: monthRevenue,
      fixed: monthFixed,
      target,
      left: Math.max(0, target - monthRevenue),
      progress: target > 0 ? Math.min(1, monthRevenue / target) : 0,
    },
  };
}
