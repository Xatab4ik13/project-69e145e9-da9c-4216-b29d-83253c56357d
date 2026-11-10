import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { fmtDateShort, fmtTime, rub, total } from "@/lib/crm/logic";
import {
  WASHERS, WASHER_SHARE, ACQUIRING_FEE, SBP_FEE, TAX_RATE, billsIn, daysInMonth, paidIn, summarize,
  type ExpenseBill, type Period,
} from "@/lib/crm/finance";
import type { Booking } from "@/lib/crm/types";

const money = (n: number) => rub(Math.round(n));
const METHOD: Record<string, string> = { cash: "Наличные", terminal: "Терминал", app: "Приложение" };

const monthPeriod = (month: string, today: string): Period => {
  const last = `${month}-${String(daysInMonth(`${month}-01`)).padStart(2, "0")}`;
  return { from: `${month}-01`, to: last < today ? last : today };
};
const shiftMonth = (month: string, by: number) => {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};
const monthTitle = (month: string) =>
  new Date(`${month}-15T12:00:00`).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

interface Props {
  bookings: Booking[];
  bills: ExpenseBill[];
  today: string;
  onAddBill: (bill: ExpenseBill) => void;
  onRemoveBill: (id: string) => void;
}

export function AdminFinance({ bookings, bills, today, onAddBill, onRemoveBill }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const period = monthPeriod(month, today);
  const s = useMemo(() => summarize(bookings, period, today, bills), [bookings, period.from, period.to, today, bills]);
  const paid = useMemo(() => paidIn(bookings, period), [bookings, period.from, period.to]);
  const monthBills = useMemo(
    () => billsIn(bills, { from: `${month}-01`, to: `${month}-31` }).sort((a, b) => b.date.localeCompare(a.date)),
    [bills, month],
  );

  const days = useMemo(() => {
    return [...s.days].reverse().map(({ date }) => {
      const orders = paid.filter((b) => b.date === date).sort((a, b) => a.start - b.start);
      const m = { cash: 0, terminal: 0, app: 0 };
      for (const b of orders) if (b.paymentMethod) m[b.paymentMethod] += total(b);
      const revenue = m.cash + m.terminal + m.app;
      const dayBills = billsIn(bills, { from: date, to: date });
      const fixed = dayBills.reduce((a, b) => a + b.amount, 0);
      const variable = revenue * (WASHER_SHARE + TAX_RATE) + m.terminal * ACQUIRING_FEE + m.app * SBP_FEE;
      return { date, orders, m, revenue, dayBills, expenses: fixed + variable, result: revenue - fixed - variable };
    });
  }, [s.days, paid, bills]);

  const isCurrent = month === today.slice(0, 7);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 md:bg-background md:px-6 md:pt-5">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Финансы</h1>
        <div className="hidden md:block"><AdminNotificationIndicator /></div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" aria-label="Предыдущий месяц" onClick={() => { setMonth(shiftMonth(month, -1)); setOpenDay(null); }} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronLeft className="h-5 w-5" /></button>
        <span className="min-w-44 text-center text-lg font-semibold capitalize">{monthTitle(month)}</span>
        <button type="button" aria-label="Следующий месяц" disabled={isCurrent} onClick={() => { setMonth(shiftMonth(month, 1)); setOpenDay(null); }} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-40"><ChevronRight className="h-5 w-5" /></button>
        {isCurrent && <span className="hidden text-muted-foreground sm:inline">по {fmtDateShort(today)}</span>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="Доходы" value={money(s.revenue)} hint={`${s.visits} оплаченных заказов`} />
        <Kpi label="Расходы" value={money(s.expenses)} />
        <Kpi label={s.profit >= 0 ? "Прибыль" : "Убыток"} value={money(Math.abs(s.profit))} tone={s.profit >= 0 ? "ok" : "alert"} className="col-span-2 lg:col-span-1" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Box title="Касса по способам оплаты">
          <Line name="Наличные" value={money(s.methods.cash)} />
          <Line name="Терминал" value={money(s.methods.terminal)} />
          <Line name="Приложение" value={money(s.methods.app)} />
          <Line name="Итого" value={money(s.revenue)} strong />
        </Box>
        <Box title="Мойщики · 30% от своих заказов">
          {WASHERS.map((w) => (
            <Line key={w} name={w} sub={`заказы ${money(s.byWasher[w] ?? 0)}`} value={money((s.byWasher[w] ?? 0) * WASHER_SHARE)} />
          ))}
          <Line name="Итого" value={money(s.payroll)} strong />
        </Box>
        <Box title="Расходы по статьям">
          <Line name="Счета и платежи" value={money(s.fixed)} />
          <Line name="Мойщики, 30%" value={money(s.payroll)} />
          <Line name="Налог УСН, 6%" value={money(s.tax)} />
          <Line name="Эквайринг, 2,56%" value={money(s.acquiring)} />
          <Line name="СБП, 0,4%" value={money(s.sbp)} />
          <Line name="Итого" value={money(s.expenses)} strong />
        </Box>
      </div>

      <section className="mt-3 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Счета и платежи</h2>
          <button type="button" onClick={() => setAdding(true)} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-crm px-4 font-semibold text-crm-foreground">
            <Plus className="h-4 w-4" /> Добавить расход
          </button>
        </div>
        {monthBills.length === 0 ? (
          <p className="mt-3 text-muted-foreground">В этом месяце расходов нет</p>
        ) : (
          <BillList bills={monthBills} onRemove={onRemoveBill} />
        )}
      </section>

      <section className="mt-3 mb-4 rounded-xl border border-border bg-background">
        <h2 className="px-4 pt-4 text-sm font-semibold text-muted-foreground">По дням</h2>
        <div className="mt-2 hidden grid-cols-[1.2fr_repeat(6,1fr)_2rem] gap-2 border-b border-border px-4 pb-2 text-xs text-muted-foreground md:grid">
          <span>День</span><span className="text-right">Наличные</span><span className="text-right">Терминал</span><span className="text-right">Приложение</span><span className="text-right">Доход</span><span className="text-right">Расход</span><span className="text-right">Итог</span><span />
        </div>
        {days.map((d) => {
          const open = openDay === d.date;
          return (
            <Fragment key={d.date}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenDay(open ? null : d.date)}
                className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border px-4 py-3 text-left md:grid-cols-[1.2fr_repeat(6,1fr)_2rem] md:gap-2"
              >
                <span className="font-medium">{fmtDateShort(d.date)}<span className="block text-xs font-normal text-muted-foreground md:hidden">доход {money(d.revenue)} · расход {money(d.expenses)}</span></span>
                <span className="hidden text-right tabular-nums md:block">{money(d.m.cash)}</span>
                <span className="hidden text-right tabular-nums md:block">{money(d.m.terminal)}</span>
                <span className="hidden text-right tabular-nums md:block">{money(d.m.app)}</span>
                <span className="hidden text-right tabular-nums md:block">{money(d.revenue)}</span>
                <span className="hidden text-right tabular-nums md:block">{money(d.expenses)}</span>
                <span className={`text-right font-semibold tabular-nums ${d.result >= 0 ? "text-crm-ok-foreground" : "text-crm-alert-foreground"}`}>{d.result >= 0 ? "" : "−"}{money(Math.abs(d.result))}</span>
                <ChevronDown className={`h-4 w-4 justify-self-end transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="border-b border-border bg-crm-surface px-4 py-3">
                  <div className="mb-2 grid grid-cols-3 gap-2 text-sm md:hidden">
                    <span>Нал. <b className="tabular-nums">{money(d.m.cash)}</b></span>
                    <span>Терм. <b className="tabular-nums">{money(d.m.terminal)}</b></span>
                    <span>Прил. <b className="tabular-nums">{money(d.m.app)}</b></span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Заказы · {d.orders.length}</p>
                  {d.orders.length === 0 && <p className="py-1 text-muted-foreground">Нет оплаченных заказов</p>}
                  {d.orders.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 py-1.5">
                      <span className="w-12 tabular-nums text-muted-foreground">{fmtTime(b.start)}</span>
                      <span className="min-w-0 flex-1 truncate">{b.car}<span className="block text-xs text-muted-foreground">{b.paymentMethod ? METHOD[b.paymentMethod] : ""} · {b.washer ?? "мойщик не указан"}</span></span>
                      <span className="font-semibold tabular-nums">{money(total(b))}</span>
                    </div>
                  ))}
                  {d.dayBills.length > 0 && (
                    <>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">Расходы</p>
                      {d.dayBills.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 py-1.5">
                          <span className="min-w-0 flex-1 truncate">{b.name}</span>
                          <span className="font-semibold tabular-nums">−{money(b.amount)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </section>

      {adding && <AddBill today={today} onClose={() => setAdding(false)} onSave={(b) => { onAddBill(b); setAdding(false); }} />}
    </main>
  );
}

function BillList({ bills, onRemove }: { bills: ExpenseBill[]; onRemove: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? bills : bills.slice(0, 8);
  return (
    <div className="mt-2">
      {shown.map((b) => (
        <div key={b.id} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
          <span className="w-20 shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">{fmtDateShort(b.date)}</span>
          <span className="min-w-0 flex-1 truncate">{b.name}</span>
          <span className="font-semibold tabular-nums">{money(b.amount)}</span>
          <button type="button" aria-label={`Удалить расход ${b.name}`} onClick={() => onRemove(b.id)} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {bills.length > 8 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-2 min-h-11 font-semibold text-crm">
          {all ? "Свернуть" : `Показать все (${bills.length})`}
        </button>
      )}
    </div>
  );
}

function AddBill({ today, onClose, onSave }: { today: string; onClose: () => void; onSave: (b: ExpenseBill) => void }) {
  const [date, setDate] = useState(today);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const value = Number(amount.replace(",", "."));
  const ok = name.trim() && value > 0 && date;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 md:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) onSave({ id: `bill-${Date.now()}`, date, name: name.trim(), amount: value });
        }}
        className="w-full rounded-t-2xl bg-background p-5 md:max-w-md md:rounded-2xl"
      >
        <div className="flex items-center">
          <h2 className="text-xl font-bold">Новый расход</h2>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <label className="mt-4 block">
          <span className="text-sm text-muted-foreground">Что это</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, аренда за декабрь" className="mt-1 h-12 w-full rounded-lg border border-border px-3 text-base outline-none focus:border-crm" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-muted-foreground">Сумма, ₽</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} className="mt-1 h-12 w-full rounded-lg border border-border px-3 text-base tabular-nums outline-none focus:border-crm" />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Дата счёта</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-12 w-full rounded-lg border border-border px-3 text-base outline-none focus:border-crm" />
          </label>
        </div>
        <button type="submit" disabled={!ok} className="mt-5 h-12 w-full rounded-lg bg-crm text-base font-semibold text-crm-foreground disabled:opacity-40">Добавить</button>
      </form>
    </div>
  );
}

function Kpi({ label, value, hint, tone, className = "" }: { label: string; value: string; hint?: string; tone?: "ok" | "alert"; className?: string }) {
  const c = tone === "ok" ? "text-crm-ok-foreground" : tone === "alert" ? "text-crm-alert-foreground" : "";
  return (
    <div className={`rounded-xl border border-border bg-background p-4 ${className}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${c}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Line({ name, value, sub, strong }: { name: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline gap-3 py-1.5 ${strong ? "mt-1 border-t border-border pt-2 font-semibold" : ""}`}>
      <span className="min-w-0 flex-1">{name}{sub && <span className="block text-xs font-normal text-muted-foreground">{sub}</span>}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
