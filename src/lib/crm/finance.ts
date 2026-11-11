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
}

/** Stable monthly articles. Each month's plan is booked in full on the 1st, so the owner sees it up front. */
export const MONTHLY_EXPENSES: ExpenseItem[] = [
  { id: "rent", name: "Аренда", monthly: 97955.5 },
  { id: "accounting", name: "Бухгалтерия", monthly: 11000 },
  { id: "bank", name: "Банковское обслуживание", monthly: 950 },
];

/** Costs with no plan: they count only when the owner enters the paid bill, on its date. */
export const VARIABLE_ARTICLES = [
  { id: "utilities", name: "Коммуналка" },
  { id: "supplies", name: "Химия и расходники" },
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

/** Money the owner actually paid out: an article bill, another expense, or a washer payout. */
export interface FinOp {
  id: string;
  date: string;
  kind: "expense" | "payout";
  /** Article id for stable costs; "other" for one-off costs. */
  article?: string;
  washer?: string;
  name: string;
  amount: number;
}

/** Per-month plan changes the owner typed in: { "2026-12": { rent: 100000 } }. */
export type PlanOverrides = Record<string, Record<string, number>>;

export const planFor = (month: string, overrides: PlanOverrides = {}): ExpenseItem[] =>
  MONTHLY_EXPENSES.map((i) => ({ ...i, monthly: overrides[month]?.[i.id] ?? i.monthly }));

const monthOf = (d: string) => d.slice(0, 7);
const opsInMonth = (ops: FinOp[], month: string) => ops.filter((o) => monthOf(o.date) === month);

/** Plan, paid and still due for every stable article of the month. */
export function articleStatus(month: string, ops: FinOp[] = [], overrides: PlanOverrides = {}) {
  const mOps = opsInMonth(ops, month);
  return planFor(month, overrides).map((i) => {
    const paid = mOps.filter((o) => o.kind === "expense" && o.article === i.id).reduce((s, o) => s + o.amount, 0);
    return { id: i.id, name: i.name, plan: i.monthly, paid, left: Math.max(0, i.monthly - paid) };
  });
}

/** Cost of an article for the month: the plan, or more if more was actually paid. */
const articleCost = (r: { plan: number; paid: number }) => Math.max(r.plan, r.paid);

/** Stable articles land in full on the 1st; one-off expenses land on their own date. */
export function fixedRowsForPeriod(p: Period, ops: FinOp[] = [], overrides: PlanOverrides = {}) {
  const rows = new Map<string, number>();
  for (const d of dateRange(p.from, p.to)) {
    if (d.endsWith("-01"))
      for (const r of articleStatus(monthOf(d), ops, overrides)) rows.set(r.name, (rows.get(r.name) ?? 0) + articleCost(r));
  }
  const stable = new Set(MONTHLY_EXPENSES.map((i) => i.id));
  for (const o of ops)
    if (o.kind === "expense" && !(o.article && stable.has(o.article)) && o.date >= p.from && o.date <= p.to)
      rows.set(o.name, (rows.get(o.name) ?? 0) + o.amount);
  return [...rows].map(([name, value]) => ({ name, value }));
}

export const fixedForPeriod = (p: Period, ops: FinOp[] = [], overrides: PlanOverrides = {}) =>
  fixedRowsForPeriod(p, ops, overrides).reduce((s, r) => s + r.value, 0);

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

/** Revenue that covers the fixed plan after the actual tax mix, washer share and payment fees. */
export function breakevenRevenue(monthFixed: number, feeRate: number, taxRate = TAX_RATE) {
  const contribution = 1 - taxRate - WASHER_SHARE - feeRate;
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

/** Per washer: 30% earned on paid orders vs. payouts entered; debt counts everything up to `upTo`. */
export function washerLedger(list: Booking[], ops: FinOp[], p: Period, upTo: string) {
  const all: Period = { from: "0000-01-01", to: upTo };
  const earnedIn = revenueByWasher(list, p);
  const earnedAll = revenueByWasher(list, all);
  const paidSum = (w: string, q: Period) =>
    ops.filter((o) => o.kind === "payout" && o.washer === w && o.date >= q.from && o.date <= q.to).reduce((s, o) => s + o.amount, 0);
  return WASHERS.map((w) => ({
    washer: w,
    orders: earnedIn[w] ?? 0,
    earned: (earnedIn[w] ?? 0) * WASHER_SHARE,
    paid: paidSum(w, p),
    owed: Math.max(0, (earnedAll[w] ?? 0) * WASHER_SHARE - paidSum(w, all)),
  }));
}

export function summarize(
  list: Booking[],
  p: Period,
  today: string,
  ops: FinOp[] = [],
  overrides: PlanOverrides = {},
): FinanceSummary {
  const paid = paidIn(list, p);
  const revenue = revenueOf(paid);
  const methods = byMethod(list, p);
  const payroll = revenue * WASHER_SHARE;
  const acquiring = methods.terminal * ACQUIRING_FEE;
  const sbp = methods.app * SBP_FEE;
  const tax = (methods.terminal + methods.app) * TAX_RATE;
  const fixed = fixedForPeriod(p, ops, overrides);
  const expenses = fixed + payroll + acquiring + sbp + tax;

  const monthPeriod: Period = { from: `${today.slice(0, 7)}-01`, to: today };
  const monthPaid = paidIn(list, monthPeriod);
  const monthRevenue = revenueOf(monthPaid);
  const monthMethods = byMethod(list, monthPeriod);
  const monthFees = monthMethods.terminal * ACQUIRING_FEE + monthMethods.app * SBP_FEE;
  const monthTax = (monthMethods.terminal + monthMethods.app) * TAX_RATE;
  const feeRate = monthRevenue ? monthFees / monthRevenue : 0;
  const taxRate = monthRevenue ? monthTax / monthRevenue : 0;
  const monthFixed = monthlyFixedTotal(planFor(today.slice(0, 7), overrides));
  const target = breakevenRevenue(monthFixed, feeRate, taxRate);

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
