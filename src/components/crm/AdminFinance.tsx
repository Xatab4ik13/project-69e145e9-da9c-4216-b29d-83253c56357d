import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addDays, fmtDateLong, fmtDateShort, fmtTime, rub, total } from "@/lib/crm/logic";
import {
  WASHERS, VARIABLE_ARTICLES, articleStatus, daysInMonth, paidIn, summarize, washerLedger,
  type FinOp, type Period, type PlanOverrides,
} from "@/lib/crm/finance";
import type { Booking } from "@/lib/crm/types";

const money = (n: number) => rub(Math.round(n));
const METHOD: Record<string, string> = { cash: "Наличные", terminal: "Терминал", app: "Приложение" };

const shiftMonth = (month: string, by: number) =>
  new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + by, 1)).toISOString().slice(0, 7);
const monthTitle = (month: string) =>
  new Date(`${month}-15T12:00:00`).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
const monthEnd = (month: string) => `${month}-${String(daysInMonth(`${month}-01`)).padStart(2, "0")}`;

type Draft = { kind: "expense"; article: string; amount: number } | { kind: "payout"; washer: string; amount: number };

interface Props {
  bookings: Booking[];
  ops: FinOp[];
  overrides: PlanOverrides;
  today: string;
  onAddOp: (op: FinOp) => void;
  onRemoveOp: (id: string) => void;
  onPlanChange: (month: string, article: string, amount: number) => void;
}

export function AdminFinance(props: Props) {
  const { bookings, ops, overrides, today } = props;
  const [view, setView] = useState<"month" | "day">("month");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [day, setDay] = useState(today);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleteOp, setDeleteOp] = useState<FinOp | null>(null);

  const isCurrent = month === today.slice(0, 7);
  const isFuture = month > today.slice(0, 7);
  const end = monthEnd(month);
  const period: Period = view === "day"
    ? { from: day, to: day }
    : { from: `${month}-01`, to: isFuture ? `${month}-01` : end < today ? end : today };

  const s = useMemo(() => summarize(bookings, period, today, ops, overrides), [bookings, period.from, period.to, today, ops, overrides]);
  const articles = useMemo(() => articleStatus(month, ops, overrides), [month, ops, overrides]);
  const washers = useMemo(() => washerLedger(bookings, ops, period, today), [bookings, ops, period.from, period.to, today]);
  const periodOps = useMemo(
    () => ops.filter((o) => o.date >= period.from && o.date <= (view === "month" ? end : period.to)).sort((a, b) => b.date.localeCompare(a.date)),
    [ops, period.from, period.to, view, end],
  );
  const dayOrders = useMemo(
    () => (view === "day" ? paidIn(bookings, period).sort((a, b) => a.start - b.start) : []),
    [bookings, view, period.from, period.to],
  );

  const planTotal = articles.reduce((a, r) => a + r.plan, 0);
  const paidTotal = articles.reduce((a, r) => a + r.paid, 0);
  const leftTotal = articles.reduce((a, r) => a + r.left, 0);
  const owedTotal = washers.reduce((a, w) => a + w.owed, 0);
  const openDay = (d: string) => { setDay(d); setView("day"); };

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 pb-24 md:bg-background md:px-6 md:pb-6 md:pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Финансы</h1>
        <div className="hidden md:block"><AdminNotificationIndicator /></div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setDraft({ kind: "expense", article: "other", amount: 0 })} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-crm px-4 font-semibold text-crm-foreground">
            <Plus className="h-4 w-4" /> Внести оплату
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex w-full rounded-lg bg-muted p-0.5 sm:w-auto">
          {(["month", "day"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`min-h-11 flex-1 rounded-md px-4 font-medium sm:flex-none ${view === v ? "bg-crm text-crm-foreground" : "text-muted-foreground"}`}>
              {v === "month" ? "Месяц" : "День"}
            </button>
          ))}
        </div>
        {view === "month" ? (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Предыдущий месяц" onClick={() => setMonth(shiftMonth(month, -1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronLeft className="h-5 w-5" /></button>
            <span className="min-w-40 text-center text-lg font-semibold capitalize">{monthTitle(month)}</span>
            <button type="button" aria-label="Следующий месяц" onClick={() => setMonth(shiftMonth(month, 1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronRight className="h-5 w-5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Предыдущий день" onClick={() => setDay(addDays(day, -1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronLeft className="h-5 w-5" /></button>
            <input type="date" aria-label="День" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3" />
            <button type="button" aria-label="Следующий день" disabled={day >= today} onClick={() => setDay(addDays(day, 1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background disabled:opacity-40"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
        <span className="text-muted-foreground">
          {view === "day" ? fmtDateLong(day) : isFuture ? "план месяца" : isCurrent ? `по ${fmtDateShort(today)}` : "весь месяц"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Доходы" value={money(s.revenue)} hint={`${s.visits} оплаченных заказов`} />
        <Kpi label="Расходы" value={money(s.expenses)} hint={view === "month" ? `из них постоянные ${money(s.fixed)}` : "за день"} />
        <Kpi label={s.profit >= 0 ? "Прибыль" : "Убыток"} value={money(Math.abs(s.profit))} tone={s.profit >= 0 ? "ok" : "alert"} />
        <Kpi label="Осталось заплатить" value={money(leftTotal + owedTotal)} hint={`счета ${money(leftTotal)} · мойщики ${money(owedTotal)}`} tone={leftTotal + owedTotal > 0 ? "alert" : "ok"} />
      </div>

      {view === "month" && (
        <section className="mt-3 rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-semibold">Постоянные расходы месяца</h2>
            <span className="text-sm text-muted-foreground">учитываются целиком с 1-го числа · план {money(planTotal)} · оплачено {money(paidTotal)}</span>
          </div>
          <div className="mt-3 hidden grid-cols-[1.6fr_1fr_1fr_1fr_8rem] gap-3 border-b border-border pb-2 text-xs text-muted-foreground md:grid">
            <span>Статья</span><span>План на месяц</span><span className="text-right">Оплачено</span><span className="text-right">Осталось</span><span />
          </div>
          {articles.map((r) => (
            <div key={r.id} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 border-b border-border py-3 last:border-0 md:grid-cols-[1.6fr_1fr_1fr_1fr_10rem]">
              <span className="col-span-2 font-medium md:col-span-1">{r.name}</span>
              <label className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground md:hidden">План</span>
                <PlanInput key={`${month}-${r.id}-${r.plan}`} value={r.plan} onCommit={(v) => props.onPlanChange(month, r.id, v)} />
              </label>
              <span className="text-right tabular-nums"><span className="text-xs text-muted-foreground md:hidden">Оплачено </span>{money(r.paid)}</span>
              <span className={`text-right font-semibold tabular-nums ${r.left > 0 ? "text-crm-alert-foreground" : "text-crm-ok-foreground"}`}>
                <span className="text-xs font-normal text-muted-foreground md:hidden">Осталось </span>{r.left > 0 ? money(r.left) : "Оплачено"}
              </span>
              <button type="button" onClick={() => setDraft({ kind: "expense", article: r.id, amount: r.left })} className="min-h-11 whitespace-nowrap rounded-lg border border-border px-3 font-semibold">
                Внести оплату
              </button>
            </div>
          ))}
        </section>
      )}

      <div className="mt-3 grid gap-3 xl:grid-cols-[3fr_2fr]">
        <section className="rounded-xl border border-border bg-background p-4">
          <h2 className="font-semibold">Мойщики</h2>
          <p className="text-sm text-muted-foreground">начислено 30% за {view === "day" ? "день" : "месяц"} · долг на сегодня по всем заказам</p>
          {washers.map((w) => (
            <div key={w.washer} className="mt-2 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-border py-2 last:border-0 md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-x-4 [&_span]:whitespace-nowrap">
              <span className="font-medium">{w.washer}<span className="block text-xs font-normal text-muted-foreground">заказы {money(w.orders)}</span></span>
              <span className="text-right tabular-nums md:text-left"><span className="text-xs text-muted-foreground">Начислено </span>{money(w.earned)}</span>
              <span className="tabular-nums"><span className="text-xs text-muted-foreground">Выплачено </span>{money(w.paid)}</span>
              <span className={`text-right font-semibold tabular-nums md:text-left ${w.owed > 0 ? "text-crm-alert-foreground" : "text-crm-ok-foreground"}`}><span className="text-xs font-normal text-muted-foreground">Должны </span>{money(w.owed)}</span>
              <button type="button" onClick={() => setDraft({ kind: "payout", washer: w.washer, amount: Math.round(w.owed) })} className="col-span-2 min-h-11 rounded-lg border border-border px-3 font-semibold md:col-span-1">
                Выплатить
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-background p-4">
          <h2 className="font-semibold">Касса и обязательные списания</h2>
          <Line name="Наличные" value={money(s.methods.cash)} />
          <Line name="Терминал" value={money(s.methods.terminal)} />
          <Line name="Приложение" value={money(s.methods.app)} />
          <Line name="Всего пришло" value={money(s.revenue)} strong />
          <Line name="Налог УСН, 6%" value={money(s.tax)} />
          <Line name="Эквайринг, 2,56%" value={money(s.acquiring)} />
          <Line name="СБП, 0,4%" value={money(s.sbp)} />
        </section>
      </div>

      {view === "day" && (
        <section className="mt-3 rounded-xl border border-border bg-background p-4">
          <h2 className="font-semibold">Заказы дня · {dayOrders.length}</h2>
          {dayOrders.length === 0 && <p className="mt-2 text-muted-foreground">Оплаченных заказов нет</p>}
          {dayOrders.map((b) => (
            <div key={b.id} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
              <span className="w-12 tabular-nums text-muted-foreground">{fmtTime(b.start)}</span>
              <span className="min-w-0 flex-1 truncate">{b.car}<span className="block text-xs text-muted-foreground">{b.paymentMethod ? METHOD[b.paymentMethod] : ""} · {b.washer ?? "мойщик не указан"}</span></span>
              <span className="font-semibold tabular-nums">{money(total(b))}</span>
            </div>
          ))}
        </section>
      )}

      <section className="mt-3 rounded-xl border border-border bg-background p-4">
        <h2 className="font-semibold">{view === "day" ? "Оплаты за день" : "Оплаты за месяц"}</h2>
        {periodOps.length === 0 && <p className="mt-2 text-muted-foreground">Пока ничего не внесено</p>}
        {periodOps.map((o) => (
          <div key={o.id} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
            <button type="button" onClick={() => openDay(o.date)} className="hidden w-20 shrink-0 whitespace-nowrap text-left tabular-nums text-muted-foreground underline-offset-2 hover:underline md:block">{fmtDateShort(o.date)}</button>
            <span className="min-w-0 flex-1"><span className="block truncate">{o.name}</span><span className="block text-xs text-muted-foreground"><span className="md:hidden">{fmtDateShort(o.date)} · </span>{o.kind === "payout" ? "мойщику" : o.article && articles.some((a) => a.id === o.article) ? "постоянная статья" : "по счёту"}</span></span>
            <span className="font-semibold tabular-nums">{money(o.amount)}</span>
            <button type="button" aria-label={`Удалить ${o.name}`} onClick={() => setDeleteOp(o)} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </section>

      {view === "month" && !isFuture && (
        <section className="mt-3 rounded-xl border border-border bg-background p-4">
          <h2 className="font-semibold">По дням</h2>
          <p className="text-sm text-muted-foreground">нажмите на день, чтобы увидеть заказы и оплаты</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {[...s.days].reverse().map((d) => (
              <button key={d.date} type="button" onClick={() => openDay(d.date)} className="rounded-lg border border-border p-2 text-left hover:border-crm">
                <span className="block text-xs text-muted-foreground">{fmtDateShort(d.date)}</span>
                <span className="font-semibold tabular-nums">{money(d.revenue)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {draft && (
        <OpForm
          draft={draft}
          today={today}
          articles={[...articles.map((a) => ({ id: a.id, name: a.name })), ...VARIABLE_ARTICLES]}
          onClose={() => setDraft(null)}
          onSave={(op) => { props.onAddOp(op); setDraft(null); }}
        />
      )}

      <AlertDialog open={deleteOp !== null} onOpenChange={(open) => { if (!open) setDeleteOp(null); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl p-5">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-xl">Удалить платёж?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {deleteOp ? `${deleteOp.name} · ${money(deleteOp.amount)}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2 space-x-0 sm:flex">
            <AlertDialogCancel className="m-0 min-h-11">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOp) props.onRemoveOp(deleteOp.id);
                setDeleteOp(null);
              }}
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function PlanInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(Math.round(value * 100) / 100));
  const commit = () => {
    const v = Number(text.replace(",", ".").replace(/\s/g, ""));
    if (Number.isFinite(v) && v >= 0 && v !== value) onCommit(v);
    else setText(String(Math.round(value * 100) / 100));
  };
  return (
    <input
      inputMode="decimal"
      aria-label="План на месяц"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^\d.,\s]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="h-11 w-full min-w-0 rounded-lg border border-border px-3 tabular-nums outline-none focus:border-crm"
    />
  );
}

function OpForm({
  draft, today, articles, onClose, onSave,
}: {
  draft: Draft;
  today: string;
  articles: { id: string; name: string }[];
  onClose: () => void;
  onSave: (op: FinOp) => void;
}) {
  const [kind, setKind] = useState(draft.kind);
  const [article, setArticle] = useState(draft.kind === "expense" ? draft.article : "other");
  const [washer, setWasher] = useState(draft.kind === "payout" ? draft.washer : WASHERS[0]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(draft.amount > 0 ? String(Math.round(draft.amount * 100) / 100) : "");
  const [date, setDate] = useState(today);
  const value = Number(amount.replace(",", "."));
  const ok = value > 0 && !!date && (kind === "payout" || article !== "other" || !!name.trim());

  const save = () => {
    const id = `op-${Date.now()}`;
    if (kind === "payout") onSave({ id, date, kind, washer, name: `Выплата: ${washer}`, amount: value });
    else {
      const a = articles.find((x) => x.id === article);
      onSave({ id, date, kind, article, name: a ? a.name : name.trim(), amount: value });
    }
  };

  const field = "mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-crm";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 md:items-center" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (ok) save(); }} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:max-w-md md:rounded-2xl">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">Внести оплату</h2>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 flex rounded-lg bg-muted p-0.5">
          {(["expense", "payout"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`min-h-11 flex-1 rounded-md font-semibold ${kind === k ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {k === "expense" ? "Счёт / расход" : "Выплата мойщику"}
            </button>
          ))}
        </div>
        {kind === "expense" ? (
          <>
            <label className="mt-3 block">
              <span className="text-sm text-muted-foreground">Статья</span>
              <select value={article} onChange={(e) => setArticle(e.target.value)} className={field}>
                {articles.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                <option value="other">Другое (разовый расход)</option>
              </select>
            </label>
            {article === "other" && (
              <label className="mt-3 block">
                <span className="text-sm text-muted-foreground">Что это</span>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, ремонт насоса" className={field} />
              </label>
            )}
          </>
        ) : (
          <label className="mt-3 block">
            <span className="text-sm text-muted-foreground">Мойщик</span>
            <select value={washer} onChange={(e) => setWasher(e.target.value)} className={field}>
              {WASHERS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-muted-foreground">Сумма, ₽</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} className={`${field} tabular-nums`} />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Дата оплаты</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
        </div>
        <button type="submit" disabled={!ok} className="mt-5 h-12 w-full rounded-lg bg-crm text-base font-semibold text-crm-foreground disabled:opacity-40">Сохранить</button>
      </form>
    </div>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" | "alert" }) {
  const c = tone === "ok" ? "text-crm-ok-foreground" : tone === "alert" ? "text-crm-alert-foreground" : "";
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums md:text-2xl ${c}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Line({ name, value, strong }: { name: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline gap-3 py-1.5 ${strong ? "border-b border-border pb-2 font-semibold" : ""}`}>
      <span className="min-w-0 flex-1">{name}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
