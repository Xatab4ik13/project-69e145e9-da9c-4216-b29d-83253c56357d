import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { addDays, fmtDateLong, fmtDateShort, rub } from "@/lib/crm/logic";
import { daysInMonth, washerLedger, type FinOp, type Period } from "@/lib/crm/finance";
import type { Booking } from "@/lib/crm/types";

type View = "day" | "month" | "period";

const money = (n: number) => rub(Math.round(n));
const shiftMonth = (month: string, by: number) =>
  new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + by, 1)).toISOString().slice(0, 7);
const monthTitle = (month: string) =>
  new Date(`${month}-15T12:00:00`).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
const monthEnd = (month: string) => `${month}-${String(daysInMonth(`${month}-01`)).padStart(2, "0")}`;

interface Props {
  bookings: Booking[];
  ops: FinOp[];
  today: string;
}

export function AdminWashers({ bookings, ops, today }: Props) {
  const [view, setView] = useState<View>("month");
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);

  const currentMonth = today.slice(0, 7);
  const end = monthEnd(month);
  const period: Period = view === "day"
    ? { from: day, to: day }
    : view === "period"
      ? from <= to ? { from, to } : { from: to, to: from }
      : { from: `${month}-01`, to: month > currentMonth ? `${month}-01` : end < today ? end : today };

  const washers = useMemo(
    () => washerLedger(bookings, ops, period, today),
    [bookings, ops, period.from, period.to, today],
  );
  const earned = washers.reduce((sum, washer) => sum + washer.earned, 0);
  const paid = washers.reduce((sum, washer) => sum + washer.paid, 0);
  const owed = washers.reduce((sum, washer) => sum + washer.owed, 0);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 pb-24 md:bg-background md:px-6 md:pb-6 md:pt-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Мойщики</h1>
        <div className="hidden md:block"><AdminNotificationIndicator /></div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Начисления и выплаты за период · долг общий на сегодня</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex w-full rounded-lg bg-muted p-0.5 sm:w-auto">
          {([["day", "День"], ["month", "Месяц"], ["period", "Период"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`min-h-11 flex-1 rounded-md px-4 font-medium sm:flex-none ${view === id ? "bg-crm text-crm-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "day" && (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Предыдущий день" onClick={() => setDay(addDays(day, -1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronLeft className="h-5 w-5" /></button>
            <input type="date" aria-label="День" value={day} max={today} onChange={(event) => event.target.value && setDay(event.target.value)} className="h-11 rounded-lg border border-border bg-background px-3" />
            <button type="button" aria-label="Следующий день" disabled={day >= today} onClick={() => setDay(addDays(day, 1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-40"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}

        {view === "month" && (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Предыдущий месяц" onClick={() => setMonth(shiftMonth(month, -1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronLeft className="h-5 w-5" /></button>
            <span className="min-w-40 text-center text-lg font-semibold capitalize">{monthTitle(month)}</span>
            <button type="button" aria-label="Следующий месяц" onClick={() => setMonth(shiftMonth(month, 1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}

        {view === "period" && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <input type="date" aria-label="Начало периода" value={from} max={today} onChange={(event) => event.target.value && setFrom(event.target.value)} className="h-11 min-w-0 rounded-lg border border-border bg-background px-3" />
            <input type="date" aria-label="Конец периода" value={to} max={today} onChange={(event) => event.target.value && setTo(event.target.value)} className="h-11 min-w-0 rounded-lg border border-border bg-background px-3" />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi label="Всего заработали" value={money(earned)} className="col-span-2 md:col-span-1" />
        <Kpi label="Выплачено за период" value={money(paid)} />
        <Kpi label="Общий долг на сегодня" value={money(owed)} tone={owed > 0 ? "alert" : "ok"} />
      </div>

      <section className="mt-3 rounded-xl border border-border bg-background p-4">
        <h2 className="font-semibold">Расчёт по мойщикам</h2>
        <p className="mt-1 text-sm text-muted-foreground">Начислено 30% от оплаченных заказов каждого мойщика</p>
        <div className="mt-3 hidden grid-cols-[1.2fr_1fr_1fr_1.2fr] gap-4 border-b border-border pb-2 text-xs text-muted-foreground md:grid">
          <span>Мойщик</span><span>Заработал</span><span>Выплачено</span><span>Должны на сегодня</span>
        </div>
        {washers.map((washer) => (
          <article key={washer.washer} aria-label={`Мойщик ${washer.washer}`} className="grid grid-cols-3 items-center gap-3 border-b border-border py-4 last:border-0 md:grid-cols-[1.2fr_1fr_1fr_1.2fr] md:gap-4">
            <h3 className="col-span-3 text-base font-semibold md:col-span-1 md:font-medium">{washer.washer}</h3>
            <Value label="Заработал" value={money(washer.earned)} />
            <Value label="Выплачено" value={money(washer.paid)} />
            <Value label="Должны" value={money(washer.owed)} tone={washer.owed > 0 ? "alert" : "ok"} />
          </article>
        ))}
      </section>
    </main>
  );
}

function Kpi({ label, value, tone, className = "" }: { label: string; value: string; tone?: "ok" | "alert"; className?: string }) {
  const color = tone === "ok" ? "text-crm-ok-foreground" : tone === "alert" ? "text-crm-alert-foreground" : "";
  return (
    <div className={`rounded-xl border border-border bg-background p-4 ${className}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums md:text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function Value({ label, value, tone }: { label: string; value: string; tone?: "ok" | "alert" }) {
  const color = tone === "ok" ? "text-crm-ok-foreground" : tone === "alert" ? "text-crm-alert-foreground" : "";
  return (
    <div>
      <span className="block text-xs text-muted-foreground md:hidden">{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
