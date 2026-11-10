import { useMemo, useState } from "react";
import {
  Banknote, CreditCard, Gauge, Repeat, Smartphone, TrendingDown, TrendingUp, Users, Wallet,
} from "lucide-react";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { addDays, fmtDateLong, fmtDateShort, rub } from "@/lib/crm/logic";
import {
  WASHERS, WASHER_SHARE, fixedRowsForPeriod, summarize,
  type FinanceSummary, type Period,
} from "@/lib/crm/finance";
import type { Booking } from "@/lib/crm/types";

type PeriodKind = "today" | "week" | "month" | "custom";

const PERIODS: { id: PeriodKind; label: string }[] = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "custom", label: "Свой период" },
];

const money = (n: number) => rub(Math.round(n));
const pct = (x: number) => `${Math.round(x * 100)}%`;

function periodFor(kind: PeriodKind, today: string, from: string, to: string): Period {
  if (kind === "today") return { from: today, to: today };
  if (kind === "week") return { from: addDays(today, -6), to: today };
  if (kind === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  return from <= to ? { from, to } : { from: to, to: from };
}

const periodLabel = (p: Period) =>
  p.from === p.to ? fmtDateLong(p.from) : `${fmtDateShort(p.from)} — ${fmtDateShort(p.to)} ${p.to.slice(0, 4)}`;

function useDashboard(bookings: Booking[], today: string) {
  const [kind, setKind] = useState<PeriodKind>("month");
  const [from, setFrom] = useState(() => addDays(today, -13));
  const [to, setTo] = useState(today);
  const period = useMemo(() => periodFor(kind, today, from, to), [kind, today, from, to]);
  const summary = useMemo(() => summarize(bookings, period, today), [bookings, period, today]);
  return { kind, setKind, from, setFrom, to, setTo, period, summary };
}

interface DashProps {
  bookings: Booking[];
  today: string;
}

export function AdminDashboard({ bookings, today }: DashProps) {
  const { kind, setKind, from, setFrom, to, setTo, period, summary } = useDashboard(bookings, today);
  return (
    <main className="hidden min-w-0 flex-1 flex-col px-6 pb-4 pt-5 md:flex">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
        <AdminNotificationIndicator />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg bg-muted p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setKind(p.id)}
              aria-pressed={kind === p.id}
              className={`rounded-md px-4 py-1.5 font-medium ${kind === p.id ? "bg-crm text-crm-foreground" : "text-muted-foreground"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {kind === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" aria-label="Начало периода" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border px-3 py-1.5" />
            <span className="text-muted-foreground">—</span>
            <input type="date" aria-label="Конец периода" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border px-3 py-1.5" />
          </div>
        )}
        <span className="ml-auto text-muted-foreground">{periodLabel(period)}</span>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Выручка" value={money(summary.revenue)} hint={`${summary.visits} оплаченных визитов`} Icon={Wallet} />
          <Metric label="Расходы" value={money(summary.expenses)} hint={`постоянные ${money(summary.fixed)}`} Icon={TrendingDown} />
          <Metric
            label={summary.profit >= 0 ? "Прибыль" : "Убыток"}
            value={money(Math.abs(summary.profit))}
            hint={summary.revenue ? `маржа ${pct(summary.profit / summary.revenue)} от выручки` : "нет оплат за период"}
            tone={summary.profit >= 0 ? "ok" : "alert"}
            Icon={summary.profit >= 0 ? TrendingUp : TrendingDown}
          />
          <Breakeven summary={summary} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <Card title="Загрузка боксов">
            <p className="text-2xl font-bold tabular-nums">{pct(summary.load.overall)}</p>
            <p className="mt-1 text-xs text-muted-foreground">из {summary.load.days} раб. дней по 12 часов</p>
            <div className="mt-3 space-y-3">
              <BarRow label="Бокс 1" value={pct(summary.load.box1)} share={summary.load.box1} />
              <BarRow label="Бокс 2" value={pct(summary.load.box2)} share={summary.load.box2} />
            </div>
          </Card>
          <Card title="Средний чек">
            <p className="text-2xl font-bold tabular-nums">{money(summary.avgCheck)}</p>
            <p className="mt-1 text-xs text-muted-foreground">на {summary.visits} оплаченных визитов</p>
            <div className="mt-4 border-t border-border pt-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Repeat className="h-4 w-4" /> Повторные визиты</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{pct(summary.repeat.share)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{summary.repeat.repeat} из {summary.repeat.visits} визитов — те, кто был раньше</p>
            </div>
          </Card>
          <Card title="Оплаты по способам">
            <div className="space-y-3">
              <BarRow label="Наличные" value={money(summary.methods.cash)} share={summary.revenue ? summary.methods.cash / summary.revenue : 0} />
              <BarRow label="Терминал" value={money(summary.methods.terminal)} share={summary.revenue ? summary.methods.terminal / summary.revenue : 0} hint={`эквайринг ${money(summary.acquiring)}`} />
              <BarRow label="В приложении" value={money(summary.methods.app)} share={summary.revenue ? summary.methods.app / summary.revenue : 0} hint={`СБП ${money(summary.sbp)}`} />
            </div>
          </Card>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <Card title="Выручка по дням" className="lg:col-span-2">
            <RevenueChart summary={summary} />
          </Card>
          <Card title="Мойщики · 30% от своих заказов">
            <div className="space-y-3">
              {WASHERS.map((w) => {
                const rev = summary.byWasher[w] ?? 0;
                return (
                  <BarRow
                    key={w}
                    label={w}
                    value={money(rev * WASHER_SHARE)}
                    share={summary.revenue ? rev / summary.revenue : 0}
                    hint={`заказы ${money(rev)}`}
                  />
                );
              })}
            </div>
          </Card>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Card title="Расходы за период">
            <ExpenseRows summary={summary} />
          </Card>
        </div>
      </div>
    </main>
  );
}

export function MobileDashboard({ bookings, today }: DashProps) {
  const { kind, setKind, from, setFrom, to, setTo, period, summary } = useDashboard(bookings, today);
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 md:hidden">
      <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>

      <div className="mt-3 flex gap-1 overflow-x-auto rounded-lg bg-background p-1 shadow-sm">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setKind(p.id)}
            aria-pressed={kind === p.id}
            className={`min-h-11 shrink-0 rounded-md px-3 text-sm font-semibold ${kind === p.id ? "bg-crm-soft text-crm" : "text-muted-foreground"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {kind === "custom" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <span className="block text-xs text-muted-foreground">С какой даты</span>
            <input type="date" aria-label="Начало периода" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full bg-transparent outline-none" />
          </label>
          <label className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <span className="block text-xs text-muted-foreground">По какую дату</span>
            <input type="date" aria-label="Конец периода" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full bg-transparent outline-none" />
          </label>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{periodLabel(period)}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric label="Выручка" value={money(summary.revenue)} hint={`${summary.visits} визитов`} Icon={Wallet} />
        <Metric label="Расходы" value={money(summary.expenses)} hint={`постоянные ${money(summary.fixed)}`} Icon={TrendingDown} />
        <Metric
          label={summary.profit >= 0 ? "Прибыль" : "Убыток"}
          value={money(Math.abs(summary.profit))}
          hint={summary.revenue ? `маржа ${pct(summary.profit / summary.revenue)}` : "нет оплат"}
          tone={summary.profit >= 0 ? "ok" : "alert"}
          Icon={summary.profit >= 0 ? TrendingUp : TrendingDown}
        />
        <Metric label="Средний чек" value={money(summary.avgCheck)} hint={`повторные ${pct(summary.repeat.share)}`} Icon={Users} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Gauge className="h-4 w-4" /> До безубыточности</p>
        <p className="mt-2 text-2xl font-bold tabular-nums">{money(summary.month.left)}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-2 rounded-full bg-crm" style={{ width: `${Math.max(2, Math.round(summary.month.progress * 100))}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Выручка месяца {money(summary.month.revenue)} из цели {money(summary.month.target)}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Gauge className="h-4 w-4" /> Загрузка боксов</p>
        <p className="mt-2 text-2xl font-bold tabular-nums">{pct(summary.load.overall)}</p>
        <div className="mt-3 space-y-3">
          <BarRow label="Бокс 1" value={pct(summary.load.box1)} share={summary.load.box1} />
          <BarRow label="Бокс 2" value={pct(summary.load.box2)} share={summary.load.box2} />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold text-muted-foreground">Выручка по дням</p>
        <div className="mt-3"><RevenueChart summary={summary} /></div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold text-muted-foreground">Оплаты по способам</p>
        <div className="mt-3 space-y-3">
          <BarRow label="Наличные" value={money(summary.methods.cash)} share={summary.revenue ? summary.methods.cash / summary.revenue : 0} />
          <BarRow label="Терминал" value={money(summary.methods.terminal)} share={summary.revenue ? summary.methods.terminal / summary.revenue : 0} hint={`эквайринг ${money(summary.acquiring)}`} />
          <BarRow label="В приложении" value={money(summary.methods.app)} share={summary.revenue ? summary.methods.app / summary.revenue : 0} hint={`СБП ${money(summary.sbp)}`} />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold text-muted-foreground">Мойщики · 30% от своих заказов</p>
        <div className="mt-3 space-y-3">
          {WASHERS.map((w) => {
            const rev = summary.byWasher[w] ?? 0;
            return (
              <BarRow
                key={w}
                label={w}
                value={money(rev * WASHER_SHARE)}
                share={summary.revenue ? rev / summary.revenue : 0}
                hint={`заказы ${money(rev)}`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3 mb-2 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold text-muted-foreground">Расходы за период</p>
        <div className="mt-3"><ExpenseRows summary={summary} /></div>
      </div>
    </main>
  );
}

function Metric({
  label, value, hint, tone = "plain", Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "ok" | "alert";
  Icon: typeof Wallet;
}) {
  const toneClass = tone === "ok" ? "text-crm-ok-foreground" : tone === "alert" ? "text-crm-alert-foreground" : "";
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" /> {label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Breakeven({ summary }: { summary: FinanceSummary }) {
  const monthName = new Date(`${summary.month.from}T12:00:00`).toLocaleDateString("ru-RU", { month: "long" });
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Gauge className="h-4 w-4" /> До безубыточности</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{money(summary.month.left)}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-2 rounded-full bg-crm" style={{ width: `${Math.max(2, Math.round(summary.month.progress * 100))}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {monthName}: выручка {money(summary.month.revenue)} из цели {money(summary.month.target)}
      </p>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-background p-4 ${className}`}>
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BarRow({ label, value, share, hint }: { label: string; value: string; share: number; hint?: string }) {
  const width = Math.max(2, Math.min(100, Math.round(share * 100)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-2 rounded-full bg-crm" style={{ width: `${width}%` }} />
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ExpenseRows({ summary }: { summary: FinanceSummary }) {
  const rows = [
    ...fixedRowsForPeriod(summary.period).map((r) => ({ name: r.name, value: r.value })),
    { name: "Мойщики, 30%", value: summary.payroll },
    { name: "Налог УСН, 6%", value: summary.tax },
    { name: "Эквайринг, 2,56%", value: summary.acquiring },
    { name: "СБП в приложении, 0,4%", value: summary.sbp },
  ];
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.name} className="flex items-baseline justify-between gap-3 py-1.5">
          <span className="min-w-0 break-words">{r.name}</span>
          <span className="shrink-0 font-semibold tabular-nums">{money(r.value)}</span>
        </li>
      ))}
      <li className="flex items-baseline justify-between gap-3 pt-2 font-semibold">
        <span>Итого</span>
        <span className="tabular-nums">{money(summary.expenses)}</span>
      </li>
    </ul>
  );
}

function RevenueChart({ summary }: { summary: FinanceSummary }) {
  const max = Math.max(1, ...summary.days.map((d) => d.revenue));
  const showLabel = (date: string) =>
    summary.days.length <= 12 || [1, 10, 20, 30].includes(Number(date.slice(8, 10)));
  return (
    <div>
      <div className="flex h-36 items-end gap-1">
        {summary.days.map((d) => (
          <div
            key={d.date}
            title={`${fmtDateShort(d.date)} — ${money(d.revenue)}`}
            className={`min-w-0 flex-1 rounded-t ${d.revenue > 0 ? "bg-crm" : "bg-muted"}`}
            style={{ height: `${Math.max(3, Math.round((d.revenue / max) * 100))}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {summary.days.map((d) => (
          <span key={d.date} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground">
            {showLabel(d.date) ? Number(d.date.slice(8, 10)) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function RuleLine({ text }: { text: string }) {
  return (
    <li className="flex gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-crm" />
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}
