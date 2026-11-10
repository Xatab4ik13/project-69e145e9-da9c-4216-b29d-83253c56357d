import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, Banknote, Calendar, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Clock, CreditCard, Phone, Plus, Search, Smartphone, Star, User, Wrench, X,
} from "lucide-react";
import logo from "@/assets/aquarius-logo.webp.asset.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminServices } from "@/components/crm/AdminServices";
import { AdminLoyalty } from "@/components/crm/AdminLoyalty";
import { AdminClients } from "@/components/crm/AdminClients";
import { carTypeForClass } from "@/lib/crm/clients";
import type { Booking, BookingSource, PaymentMethod } from "@/lib/crm/types";
import { METHOD_LABEL, SOURCE_LABEL } from "@/lib/crm/types";
import { SLOT_MIN, DEMO_NOW_MIN, DEMO_TODAY, EXTRAS, MOCK_BOOKINGS, PACKAGES, WORKERS } from "@/lib/crm/mock";
import {
  CLOSE_MIN, OPEN_MIN, addDays, applyPayment, finishWash, fmtDateLong, fmtDateShort,
  fmtTime, rub, autoStart, cancelBooking, confirmBooking, needsCall, total, bookingDuration, freeSlots, readyAndInvoice, fmtPhone, phoneDigits, bookingMatches,
  bookingState, STATE_LABEL, STATE_ACTION,
} from "@/lib/crm/logic";
import type { BookingState } from "@/lib/crm/logic";

type NewBookingInitial = { box: 1 | 2; start: number; phone?: string; car?: string; carType?: string };

const PX_PER_MIN = 2;
const HOURS = Array.from({ length: (CLOSE_MIN - OPEN_MIN) / 60 + 1 }, (_, i) => OPEN_MIN + i * 60);

export function AdminSchedule() {
  const [bookings, setBookings] = useState<Booking[]>(() => MOCK_BOOKINGS.map((b) => autoStart(b, DEMO_TODAY, DEMO_NOW_MIN)));
  const [date, setDate] = useState(DEMO_TODAY);
  const [selectedId, setSelectedId] = useState<string | null>("b3");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | BookingSource>("all");
  const [newOpen, setNewOpen] = useState<NewBookingInitial | null>(null);
  const [section, setSection] = useState<AdminSection>("schedule");
  const [loyaltyClientId, setLoyaltyClientId] = useState("lc1");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter(
      (b) =>
        b.date === date &&
        b.wash !== "cancelled" &&
        (source === "all" || b.source === source) &&
        (!q || bookingMatches(b, q)),
    );
  }, [bookings, date, query, source]);

  const selected = bookings.find((b) => b.id === selectedId) ?? null;
  const update = (id: string, fn: (b: Booking) => Booking) =>
    setBookings((list) => list.map((b) => (b.id === id ? fn(b) : b)));

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background text-sm text-foreground">
      <Sidebar section={section} onChange={setSection} />
      {section === "services" ? <AdminServices /> : section === "clients" ? (
        <AdminClients
          onOpenLoyalty={(clientId) => { setLoyaltyClientId(clientId); setSection("loyalty"); }}
          onNewBooking={(client) => {
            const car = client.cars.find((item) => item.primary) ?? client.cars[0];
            setSelectedId(null);
            setSection("schedule");
            setNewOpen({ box: 1, start: 12 * 60, phone: client.phone, car: car?.name, carType: car ? carTypeForClass(car.carClass) : undefined });
          }}
        />
      ) : section === "loyalty" ? <AdminLoyalty initialClientId={loyaltyClientId} /> : <main className="flex min-w-0 flex-1 flex-col px-6 pt-5 pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Расписание</h1>
          <label className="ml-auto flex w-80 items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Телефон или автомобиль" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
          </label>
          <button type="button" aria-label="Уведомления" className="p-2"><Bell className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" aria-label="Предыдущий день" onClick={() => setDate(addDays(date, -1))} className="rounded-lg border border-border p-2"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-60 text-center text-lg font-semibold">{fmtDateLong(date)}</span>
          <button type="button" aria-label="Следующий день" onClick={() => setDate(addDays(date, 1))} className="rounded-lg border border-border p-2"><ChevronRight className="h-4 w-4" /></button>
          <button type="button" onClick={() => setDate(DEMO_TODAY)} className="ml-3 rounded-lg border border-border px-4 py-2 font-medium">Сегодня</button>
          <button type="button" onClick={() => setNewOpen({ box: 1, start: 12 * 60 })} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-crm px-5 py-2.5 font-semibold text-crm-foreground">
            <Plus className="h-4 w-4" /> Новая запись
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Legend />
          <div className="ml-auto flex rounded-lg bg-muted p-0.5">
            <span className="rounded-md bg-crm px-4 py-1.5 font-medium text-crm-foreground">День</span>
            <span className="cursor-not-allowed px-4 py-1.5 text-muted-foreground" title="Скоро">Неделя</span>
          </div>
          <div className="relative">
            <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9">
              <option value="all">Все источники</option>
              <option value="site">Сайт</option>
              <option value="app">Приложение</option>
              <option value="admin">Администратор</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>

        <Grid
          date={date}
          bookings={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={(box, start) => setNewOpen({ box, start })}
        />
      </main>}

      {section === "schedule" && selected && (
        <OrderPanel
          key={selected.id}
          b={selected}
          onClose={() => setSelectedId(null)}
          onCancel={() => { update(selected.id, cancelBooking); setSelectedId(null); }}
          onUpdate={(fn) => update(selected.id, fn)}
        />
      )}

      <NewBookingDialog
        open={!!newOpen}
        initial={newOpen}
        date={date}
        bookings={bookings}
        onClose={() => setNewOpen(null)}
        onCreate={(b) => {
          setBookings((l) => [...l, b]);
          setSelectedId(b.id);
          setNewOpen(null);
        }}
      />
    </div>
  );
}

type AdminSection = "schedule" | "clients" | "services" | "loyalty";

function Sidebar({ section, onChange }: { section: AdminSection; onChange: (section: AdminSection) => void }) {
  const items: { label: string; icon: typeof CalendarDays; target?: AdminSection }[] = [
    { label: "Расписание", icon: CalendarDays, target: "schedule" },
    { label: "Клиенты", icon: User, target: "clients" },
    { label: "Лояльность", icon: Star, target: "loyalty" },
    { label: "Уведомления", icon: Bell },
    { label: "Услуги", icon: Wrench, target: "services" },
  ];
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-crm-surface px-3 py-5">
      <div className="px-2">
        <img src={logo.url} alt="Aquarius" width={160} height={62} className="h-11 w-auto" />
        <p className="mt-3 text-muted-foreground">Управление мойкой</p>
      </div>
      <nav className="mt-6 space-y-1">
        {items.map(({ label, icon: Icon, target }) => {
          const active = target === section;
          return (
            <button
              key={label}
              type="button"
              disabled={!target}
              onClick={() => target && onChange(target)}
              aria-current={active ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium disabled:cursor-default ${active ? "bg-crm-soft text-crm" : "text-foreground"}`}
            >
              <Icon className="h-5 w-5" /> {label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto space-y-4">
        <span className="flex items-center gap-3 px-3"><CircleHelp className="h-5 w-5" /> Помощь</span>
        <div className="flex items-center gap-3 border-t border-border px-2 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-crm font-semibold text-crm-foreground">А</span>
          <div>
            <p className="font-semibold">Администратор</p>
            <p className="text-xs text-crm">Мой аккаунт</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Grid({
  date, bookings, selectedId, onSelect, onAdd,
}: {
  date: string;
  bookings: Booking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (box: 1 | 2, start: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = (14 * 60 - OPEN_MIN) * PX_PER_MIN - 12;
  }, []);
  const height = (CLOSE_MIN - OPEN_MIN) * PX_PER_MIN;
  const showNow = date === DEMO_TODAY;
  const nowTop = (DEMO_NOW_MIN - OPEN_MIN) * PX_PER_MIN;

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[5rem_1fr_1fr] border-b border-border bg-crm-surface text-center text-base font-semibold">
        <span />
        <span className="border-l border-border py-2.5">Бокс 1</span>
        <span className="border-l border-border py-2.5">Бокс 2</span>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative grid grid-cols-[5rem_1fr_1fr] py-3" style={{ height: height + 24 }}>
          <div className="relative">
            {HOURS.flatMap((m) => [m, m + 30]).filter((m) => m <= CLOSE_MIN).map((m) => (
              <span key={m} className={`absolute right-3 -translate-y-1/2 whitespace-nowrap tabular-nums ${m % 60 ? "text-xs text-muted-foreground" : "text-base"}`} style={{ top: (m - OPEN_MIN) * PX_PER_MIN }}>
                {fmtTime(m)}
              </span>
            ))}
          </div>
          {([1, 2] as const).map((box) => (
            <div
              key={box}
              className="relative border-l border-border"
              onDoubleClick={(e) => {
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                onAdd(box, OPEN_MIN + Math.round(y / PX_PER_MIN / 15) * 15);
              }}
            >
              {HOURS.map((m) => (
                <div key={m} className="absolute inset-x-0 border-t border-border/60" style={{ top: (m - OPEN_MIN) * PX_PER_MIN }} />
              ))}
              {HOURS.filter((m) => m + SLOT_MIN <= CLOSE_MIN && !bookings.some((b) => b.box === box && b.wash !== "cancelled" && b.start < m + SLOT_MIN && m < b.start + b.duration)).map((m) => (
                <button key={`f${m}`} type="button" onClick={() => onAdd(box, m)}
                  className="group absolute inset-x-2 flex items-center justify-between rounded-lg border border-dashed border-crm-ok-foreground/60 bg-crm-ok/60 px-3 text-left text-crm-ok-foreground transition-colors hover:border-solid hover:bg-crm-ok"
                  style={{ top: (m - OPEN_MIN) * PX_PER_MIN + 2, height: SLOT_MIN * PX_PER_MIN - 4 }}>
                  <span><span className="block font-semibold">{fmtTime(m)} – {fmtTime(m + SLOT_MIN)}</span><span className="text-xs">Свободно</span></span>
                  <span className="flex items-center gap-1 text-xs font-semibold opacity-60 group-hover:opacity-100"><Plus className="h-4 w-4" />Записать</span>
                </button>
              ))}
              {bookings.filter((b) => b.box === box).map((b) => (
                <BookingCard key={b.id} b={b} selected={b.id === selectedId} onClick={() => onSelect(b.id)} />
              ))}
            </div>
          ))}
          {showNow && (
            <div className="pointer-events-none absolute inset-x-0 z-10 flex h-0 items-center" style={{ top: 12 + nowTop }}>
              <span className="ml-1 -translate-y-1/2 rounded bg-crm px-1.5 py-0.5 text-xs font-semibold text-crm-foreground">{fmtTime(DEMO_NOW_MIN)}</span>
              <span className="h-0.5 flex-1 -translate-y-1/2 bg-crm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** One look-and-feel per booking state: card, status badge and source chip. */
const TONE: Record<BookingState, { card: string; badge: string; chip: string; Icon: typeof Phone }> = {
  call: { card: "border-2 border-crm-alert-foreground bg-crm-alert text-crm-alert-foreground", badge: "bg-crm-alert-foreground text-crm-foreground", chip: "bg-crm-alert-foreground/10", Icon: Phone },
  unconfirmed: { card: "border border-crm-warn-foreground/50 bg-crm-warn text-crm-warn-foreground", badge: "bg-crm-warn-foreground/15 text-crm-warn-foreground", chip: "bg-crm-warn-foreground/10", Icon: Clock },
  confirmed: { card: "border border-crm/25 bg-crm-soft text-crm", badge: "bg-crm text-crm-foreground", chip: "bg-crm/10", Icon: Check },
  working: { card: "border-2 border-crm bg-crm text-crm-foreground", badge: "bg-crm-foreground/20 text-crm-foreground", chip: "bg-crm-foreground/20", Icon: Clock },
  ready: { card: "border border-crm-money-foreground/50 bg-crm-money text-crm-money-foreground", badge: "bg-crm-money-foreground/15 text-crm-money-foreground", chip: "bg-crm-money-foreground/10", Icon: Banknote },
  awaiting: { card: "border border-crm-money-foreground/50 bg-crm-money text-crm-money-foreground", badge: "bg-crm-money-foreground/15 text-crm-money-foreground", chip: "bg-crm-money-foreground/10", Icon: Smartphone },
  finished: { card: "border border-border bg-muted text-muted-foreground", badge: "bg-crm-ok text-crm-ok-foreground", chip: "bg-background", Icon: Check },
};

function BookingCard({ b, selected, onClick }: { b: Booking; selected: boolean; onClick: () => void }) {
  const state = bookingState(b, DEMO_TODAY, DEMO_NOW_MIN);
  const tone = TONE[state];
  const h = b.duration * PX_PER_MIN;
  const extras = b.services.length - 1;
  const { Icon } = tone;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute inset-x-2 flex flex-col justify-start overflow-hidden rounded-lg border px-3 py-1 text-left leading-tight transition-colors ${tone.card} ${selected ? "z-[5] ring-2 ring-crm ring-offset-2 ring-offset-background" : ""}`}
      style={{ top: (b.start - OPEN_MIN) * PX_PER_MIN + 1, height: h - 2 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <span className="shrink-0 whitespace-nowrap font-semibold">{fmtTime(b.start)} – {fmtTime(b.start + b.duration)}</span>
        {h > 45 && (
          <span className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${tone.badge}`}>
            <Icon className="h-3 w-3" />{STATE_LABEL[state]}
          </span>
        )}
      </div>
      <p className="truncate font-semibold">{b.car}</p>
      {h > 60 && <p className="truncate text-xs opacity-80">{b.packageName}{extras > 0 ? ` + ${extras} доп${extras > 1 && extras < 5 ? "а" : extras >= 5 ? "ов" : ""}` : ""}</p>}
      {h > 70 && (
        <div className="mt-1.5 flex w-full items-center gap-1.5">
          <span className="mr-auto font-bold">{rub(total(b))}</span>
          <span className={`rounded px-1.5 py-0.5 text-xs ${tone.chip}`}>{SOURCE_LABEL[b.source]}</span>
        </div>
      )}
    </button>
  );
}

/** Key that explains every color in the schedule. */
function Legend() {
  const items = [
    { t: "Позвонить", c: "border-crm-alert-foreground bg-crm-alert" },
    { t: "Не подтверждена", c: "border-crm-warn-foreground/60 bg-crm-warn" },
    { t: "Подтверждена", c: "border-crm/30 bg-crm-soft" },
    { t: "В работе", c: "border-crm bg-crm" },
    { t: "Готова · ждёт оплаты", c: "border-crm-money-foreground/60 bg-crm-money" },
    { t: "Завершена", c: "border-border bg-muted" },
    { t: "Свободно", c: "border-dashed border-crm-ok-foreground/60 bg-crm-ok/60" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-3.5 w-5 rounded border ${i.c}`} />{i.t}
        </span>
      ))}
    </div>
  );
}

function OrderPanel({ b, onClose, onCancel, onUpdate }: { b: Booking; onClose: () => void; onCancel: () => void; onUpdate: (fn: (b: Booking) => Booking) => void }) {
  const [method, setMethod] = useState<PaymentMethod>(b.paymentMethod ?? "terminal");
  const sum = total(b);
  const state = bookingState(b, DEMO_TODAY, DEMO_NOW_MIN);
  const StateIcon = TONE[state].Icon;
  const washLabel = b.wash === "done" ? "Готова" : b.wash === "in_progress" ? "В работе" : state === "call" ? "Позвонить" : b.confirmed ? "Подтверждена" : "Не подтверждена";
  const payLabel = b.payment === "paid" ? "Оплачено" : b.payment === "awaiting" ? "Ожидает оплаты" : "Не оплачено";
  const washTone =
    b.wash === "done" ? "bg-crm-ok text-crm-ok-foreground"
    : b.wash === "in_progress" ? "bg-crm text-crm-foreground"
    : state === "call" ? "bg-crm-alert-foreground text-crm-foreground"
    : b.confirmed ? "bg-crm-soft text-crm" : "bg-crm-warn text-crm-warn-foreground";
  const payTone =
    b.payment === "paid" ? "bg-crm-ok text-crm-ok-foreground"
    : b.payment === "awaiting" || b.wash === "done" ? "bg-crm-money text-crm-money-foreground"
    : "bg-muted text-muted-foreground";
  const methods: { id: PaymentMethod; icon: typeof CreditCard }[] = [
    { id: "terminal", icon: CreditCard },
    { id: "cash", icon: Banknote },
    { id: "app", icon: Smartphone },
  ];

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="text-lg font-semibold">Карточка заказа</h2>
        <button type="button" aria-label="Закрыть карточку" onClick={onClose} className="p-1"><X className="h-5 w-5" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <p className="mt-3 text-2xl font-bold">{b.car}</p>
        <p className="text-muted-foreground">{b.carType} · Бокс {b.box}</p>
        <p className="mt-3 flex items-center gap-2 text-base"><Calendar className="h-5 w-5" /> {fmtDateShort(b.date)} · {fmtTime(b.start)}–{fmtTime(b.start + b.duration)}</p>
        <div className="mt-3 grid grid-cols-[72px_1fr] items-center gap-y-1.5">
          <span className="text-muted-foreground">Мойка:</span>
          <span><span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium ${washTone}`}>{b.wash === "done" && <Check className="h-3 w-3" />}{washLabel}</span></span>
          <span className="text-muted-foreground">Оплата:</span>
          <span><span className={`rounded px-2 py-0.5 font-medium ${payTone}`}>{payLabel}</span></span>
        </div>
        {STATE_ACTION[state] && (
          <p className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${TONE[state].card}`}>{StateIcon && <StateIcon className="h-4 w-4" />}{STATE_ACTION[state]}</p>
        )}

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <p><span className="text-muted-foreground">Телефон:</span> {b.phone ? <a href={`tel:+7${b.phone}`} className="text-crm">{fmtPhone(b.phone)}</a> : <span className="text-muted-foreground">не указан</span>}</p>
          <p><span className="text-muted-foreground">Источник:</span> {SOURCE_LABEL[b.source].toLowerCase()}</p>
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Исполнитель:</span>
            <select value={b.worker} onChange={(e) => onUpdate((x) => ({ ...x, worker: e.target.value }))} className="rounded-md border border-border bg-background px-2 py-1">
              {WORKERS.map((w) => <option key={w}>{w}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-base font-semibold">Услуги</p>
          <ul className="mt-2 space-y-1.5">
            {b.services.map((s) => (
              <li key={s.name} className="flex justify-between"><span>{s.name}</span><span>{rub(s.price)}</span></li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-2"><Clock className="h-4 w-4" /> {b.duration} минут</p>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold">К оплате</span>
            <span className="text-2xl font-bold">{rub(sum)}</span>
          </div>
          <button type="button" className="mt-1 text-crm hover:underline">Бонусы и купоны →</button>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          {b.wash === "scheduled" && !b.confirmed && (
            <>
              {needsCall(b, DEMO_TODAY, DEMO_NOW_MIN) && (
                <p className="mb-3 flex items-center gap-2 rounded-lg border-2 border-crm-alert-foreground bg-crm-alert p-3 font-medium text-crm-alert-foreground"><Phone className="h-4 w-4" /> Позвоните клиенту: до начала меньше 15 минут</p>
              )}
              <button type="button" onClick={() => onUpdate((x) => confirmBooking(x, DEMO_TODAY, DEMO_NOW_MIN))} className="w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Клиент подтвердил</button>
              <p className="mt-2 text-center text-xs text-muted-foreground">Мойка начнётся автоматически во время записи.</p>
            </>
          )}
          {b.wash === "scheduled" && b.confirmed && (
            <p className="rounded-lg bg-crm-soft p-3 text-center font-medium text-crm">Запись подтверждена. Мойка начнётся автоматически в {fmtTime(b.start)}.</p>
          )}
          {b.wash === "scheduled" && (
            <button type="button" onClick={onCancel} className="mt-3 w-full rounded-lg border border-destructive py-2.5 font-semibold text-destructive">Отменить бронь</button>
          )}
          {b.wash === "in_progress" && (b.source === "app" ? (
              <>
                <button type="button" onClick={() => onUpdate(readyAndInvoice)} className="w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Машина готова</button>
                <p className="mt-2 text-center text-xs text-muted-foreground">Клиент получит уведомление и счёт в приложении.</p>
              </>
            ) : (
              <button type="button" onClick={() => onUpdate(finishWash)} className="w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Завершить мойку</button>
            )
          )}
          {b.wash === "done" && b.payment === "paid" && (
            <div className="rounded-lg bg-crm-ok p-4 text-crm-ok-foreground">
              <p className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4" /> Оплачено</p>
              <p className="mt-1">{METHOD_LABEL[b.paymentMethod!]} · {rub(sum)}</p>
            </div>
          )}
          {b.wash === "done" && b.payment !== "paid" && (
            <>
              <p className="text-base font-semibold">Способ оплаты</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {methods.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border px-1 py-3 ${method === id ? "border-2 border-crm bg-crm-soft" : "border-border"}`}
                  >
                    {method === id && <Check className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-crm p-0.5 text-crm-foreground" />}
                    <Icon className="h-6 w-6" />
                    <span className="text-xs">{METHOD_LABEL[id]}</span>
                  </button>
                ))}
              </div>
              {method === "terminal" && (
                <>
                  <button type="button" onClick={() => onUpdate((x) => applyPayment(x, "terminal"))} className="mt-3 w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Подтвердить оплату</button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">Нажмите после успешной оплаты на терминале.</p>
                </>
              )}
              {method === "cash" && (
                <button type="button" onClick={() => onUpdate((x) => applyPayment(x, "cash"))} className="mt-3 w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Подтвердить получение наличных</button>
              )}
              {method === "app" && (b.payment === "awaiting" ? (
                <p className="mt-3 rounded-lg bg-crm-money p-3 text-center font-medium text-crm-money-foreground">Ожидает оплаты в приложении</p>
              ) : (
                <button type="button" onClick={() => onUpdate((x) => applyPayment(x, "app"))} className="mt-3 w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Выставить счёт</button>
              ))}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function NewBookingDialog({
  open, initial, date, bookings, onClose, onCreate,
}: {
  open: boolean;
  initial: NewBookingInitial | null;
  date: string;
  bookings: Booking[];
  onClose: () => void;
  onCreate: (b: Booking) => void;
}) {
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [pkgName, setPkgName] = useState("Комфорт");
  const [extras, setExtras] = useState<string[]>([]);
  const [slot, setSlot] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSlot(null);
      setPhone(initial?.phone ?? ""); setCar(initial?.car ?? ""); setPkgName("Комфорт"); setExtras([]); setError("");
    }
  }, [open, initial]);

  const pkg = PACKAGES.find((p) => p.name === pkgName)!;
  const chosenExtras = EXTRAS.filter((e) => extras.includes(e.name));
  const services = [{ name: `Комплекс «${pkg.name}»`, price: pkg.price }, ...chosenExtras.map(({ name, price }) => ({ name, price }))];
  const duration = bookingDuration(SLOT_MIN, chosenExtras.map((e) => e.minutes));
  const slots = freeSlots(bookings, date, duration);
  const picked = slots.find((s) => s.start === slot);

  const submit = () => {
    if (!car.trim()) return setError("Укажите автомобиль.");
    if (phone.length !== 10) return setError("Введите номер телефона полностью: +7 (___) ___-__-__.");
    if (!picked) return setError("Выберите свободное время.");
    onCreate({
      id: crypto.randomUUID(), date, box: picked.box, start: picked.start, duration, car: car.trim(), carType: "Седан",
      phone, source: "admin", worker: WORKERS[0] ?? "", packageName: pkg.name, services,
      wash: "scheduled", confirmed: false, payment: "unpaid",
    });
  };

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-crm";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Новая запись · {fmtDateShort(date)}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <input type="tel" inputMode="tel" className={field} placeholder="+7 (___) ___-__-__" value={fmtPhone(phone)}
            onChange={(e) => {
              const raw = e.target.value;
              // deleting a formatting char (")", " ", "-") should remove the previous digit
              const d = raw.length < fmtPhone(phone).length && phoneDigits(raw) === phone ? phone.slice(0, -1) : phoneDigits(raw);
              setPhone(d);
            }} />
          <input className={field} placeholder="Автомобиль" value={car} onChange={(e) => setCar(e.target.value)} />
          <select className={field} value={pkgName} onChange={(e) => setPkgName(e.target.value)}>
            {PACKAGES.map((p) => <option key={p.name} value={p.name}>{p.name} · {rub(p.price)}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {EXTRAS.map((e) => {
              const on = extras.includes(e.name);
              return (
                <button key={e.name} type="button" onClick={() => { setSlot(null); setExtras((l) => on ? l.filter((x) => x !== e.name) : [...l, e.name]); }}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-crm bg-crm-soft text-crm" : "border-border"}`}>
                  {e.name} · {rub(e.price)}{e.minutes ? ` +${e.minutes} мин` : ""}
                </button>
              );
            })}
          </div>
          <div>
            <p className="mb-2 font-medium">Свободное время · {duration} минут</p>
            {slots.length === 0 ? (
              <p className="text-muted-foreground">На этот день свободных слотов нет.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button key={s.start} type="button" onClick={() => setSlot(s.start)}
                    className={`rounded-lg border py-2 ${slot === s.start ? "border-crm bg-crm text-crm-foreground" : "border-border"}`}>
                    {fmtTime(s.start)}
                  </button>
                ))}
              </div>
            )}
            {picked && <p className="mt-2 text-muted-foreground">Бокс {picked.box} назначен автоматически</p>}
          </div>
          <p className="text-muted-foreground">Итого: <b className="text-foreground">{rub(services.reduce((s, x) => s + x.price, 0))}</b></p>
          {error && <p className="text-destructive">{error}</p>}
          <button type="button" onClick={submit} className="w-full rounded-lg bg-crm py-2.5 font-semibold text-crm-foreground">Создать запись</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

