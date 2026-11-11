import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Banknote, Bell, Building2, Calendar, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Clock, CreditCard, HandCoins, LayoutDashboard, LogOut, Phone, Plus, Search, Smartphone, Star, User, Wallet, Wrench, X,
} from "lucide-react";
import { aquarius_logo as logo } from "@/assets/images";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminServices } from "@/components/crm/AdminServices";
import { AdminLoyalty } from "@/components/crm/AdminLoyalty";
import { AdminClients } from "@/components/crm/AdminClients";
import { AdminDashboard, MobileDashboard } from "@/components/crm/AdminDashboard";
import { AdminFinance } from "@/components/crm/AdminFinance";
import { AdminWashers } from "@/components/crm/AdminWashers";
import { AdminNotifications } from "@/components/crm/AdminNotifications";
import { AdminWeekSchedule } from "@/components/crm/AdminWeekSchedule";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { MobileAdminHeader, MobileAdminNavigation, MobileSchedule } from "@/components/crm/MobileSchedule";
import { TONE } from "@/components/crm/booking-tone";
import { carTypeForClass } from "@/lib/crm/clients";
import type { Booking, BookingSource, PaymentMethod } from "@/lib/crm/types";
import { METHOD_LABEL, SOURCE_LABEL, type CrmRole } from "@/lib/crm/types";
import { SLOT_MIN, DEMO_TODAY, EXTRAS, HISTORY_BOOKINGS, PACKAGES } from "@/lib/crm/mock";
import { api, bookingPatch, type ApiError, type CarHit, type NewBooking } from "@/lib/crm/api";
import { classPrice } from "@/lib/crm/booking-rules";
import { CLASS_LABEL } from "@/lib/crm/car-class";
import type { CatalogService } from "@/lib/crm/services";
import { useWashClock } from "@/lib/crm/use-wash-clock";
import { WASHERS, type FinOp, type PlanOverrides } from "@/lib/crm/finance";
import { DEMO_OPS } from "@/lib/crm/finance-mock";
import {
  CLOSE_MIN, OPEN_MIN, addDays, applyPayment, finishWash, fmtDateLong, fmtDateShort,
  fmtTime, rub, autoStart, cancelBooking, confirmBooking, needsCall, total, bookingDuration, freeSlots, readyAndInvoice, fmtPhone, phoneDigits, bookingMatches,
  bookingState, STATE_LABEL, STATE_ACTION, isPastSlot, CUSTOM_PACKAGE_NAME, customServiceDetails, receivePayment,
} from "@/lib/crm/logic";

type NewBookingInitial = { box: 1 | 2; start: number; phone?: string; car?: string; carType?: string };

const PX_PER_MIN = 2;
const HOURS = Array.from({ length: (CLOSE_MIN - OPEN_MIN) / 60 + 1 }, (_, i) => OPEN_MIN + i * 60);

export function AdminSchedule({ role, onLogout }: { role: CrmRole; onLogout: () => void }) {
  const { today, nowMin } = useWashClock();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadError, setLoadError] = useState("");
  const [date, setDate] = useState(today);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | BookingSource>("all");
  const [newOpen, setNewOpen] = useState<NewBookingInitial | null>(null);
  const [section, setSection] = useState<AdminSection>(role === "owner" ? "dashboard" : "schedule");
  const [scheduleView, setScheduleView] = useState<"day" | "week">("day");
  const [loyaltyClientId, setLoyaltyClientId] = useState<string | null>(null);
  /** Owner screens add up the demo month plus whatever happens in the live schedule. */
  const financeBookings = useMemo(() => [...HISTORY_BOOKINGS, ...bookings], [bookings]);
  /** Owner's payments and plan edits; demo months come from mock data, then live in this browser until a real backend exists. */
  const [ops, setOps] = useState<FinOp[]>(DEMO_OPS);
  const [overrides, setOverrides] = useState<PlanOverrides>({});
  const finLoaded = useRef(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FIN_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { ops: FinOp[]; overrides: PlanOverrides };
        setOps(data.ops);
        setOverrides(data.overrides);
      }
    } catch { /* keep demo data */ }
    finLoaded.current = true;
  }, []);
  useEffect(() => {
    if (finLoaded.current) window.localStorage.setItem(FIN_KEY, JSON.stringify({ ops, overrides }));
  }, [ops, overrides]);

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

  /** Two weeks around the open day; refreshed regularly so site bookings appear without reloading. */
  const from = addDays(date, -7);
  const to = addDays(date, 14);
  const load = useCallback(() => {
    api.bookings(from, to).then(
      (list) => { setBookings(list); setLoadError(""); },
      (e: ApiError) => (e.status === 401 ? onLogout() : setLoadError(e.message)),
    );
  }, [from, to, onLogout]);
  useEffect(() => {
    load();
    const id = window.setInterval(load, 20_000);
    return () => window.clearInterval(id);
  }, [load]);

  const selected = bookings.find((b) => b.id === selectedId) ?? null;
  const update = (id: string, fn: (b: Booking) => Booking) => {
    const current = bookings.find((b) => b.id === id);
    if (!current) return;
    const next = fn(current);
    setBookings((list) => list.map((b) => (b.id === id ? next : b)));
    api.updateBooking(id, bookingPatch(next)).then(
      (saved) => setBookings((list) => list.map((b) => (b.id === id ? saved : b))),
      (e: Error) => { setLoadError(`Не сохранилось: ${e.message}`); load(); },
    );
  };
  const changeSection = (next: AdminSection) => {
    if (next === "loyalty") setLoyaltyClientId(null);
    setMobileOrderOpen(false);
    setSection(next);
  };

  const changeScheduleView = (next: "day" | "week") => {
    setScheduleView(next);
    setSelectedId(null);
    setMobileOrderOpen(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-sm text-foreground md:flex-row">
      <MobileAdminHeader role={role} />
      <Sidebar section={section} onChange={changeSection} role={role} onLogout={onLogout} />
      {section === "dashboard" ? <AdminDashboard bookings={financeBookings} ops={ops} overrides={overrides} today={DEMO_TODAY} /> : section === "finance" ? null : section === "notifications" ? <AdminNotifications today={DEMO_TODAY} /> : section === "washers" ? <AdminWashers bookings={financeBookings} ops={ops} today={DEMO_TODAY} /> : section === "services" ? <AdminServices /> : section === "clients" ? (
        <AdminClients
          onOpenLoyalty={(clientId) => { setLoyaltyClientId(clientId); setSection("loyalty"); }}
          onNewBooking={(client) => {
            const car = client.cars.find((item) => item.primary) ?? client.cars[0];
            setSelectedId(null);
            setSection("schedule");
            setNewOpen({ box: 1, start: 12 * 60, phone: client.phone, car: car?.name ?? "", carType: car ? carTypeForClass(car.carClass) : "Седан" });
          }}
        />
      ) : section === "loyalty" ? <AdminLoyalty initialClientId={loyaltyClientId} /> : scheduleView === "week" ? (
        <AdminWeekSchedule
          date={date}
          bookings={bookings}
          today={today}
          nowMin={nowMin}
          onDateChange={setDate}
          onOpenDay={(nextDate) => { setDate(nextDate); changeScheduleView("day"); }}
          onViewChange={changeScheduleView}
        />
      ) : <main className="hidden min-w-0 flex-1 flex-col px-6 pb-4 pt-5 md:flex">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Расписание</h1>
          <label className="ml-auto flex w-80 items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Телефон или автомобиль" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
          </label>
          <AdminNotificationIndicator />
        </div>
        {loadError && <p role="alert" className="mt-3 rounded-lg border border-destructive px-3 py-2 text-destructive">{loadError}</p>}

        <div className="mt-4 flex items-center gap-3">
          <button type="button" aria-label="Предыдущий день" onClick={() => setDate(addDays(date, -1))} className="rounded-lg border border-border p-2"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-60 text-center text-lg font-semibold">{fmtDateLong(date)}</span>
          <button type="button" aria-label="Следующий день" onClick={() => setDate(addDays(date, 1))} className="rounded-lg border border-border p-2"><ChevronRight className="h-4 w-4" /></button>
          <button type="button" onClick={() => setDate(today)} className="ml-3 rounded-lg border border-border px-4 py-2 font-medium">Сегодня</button>
          <button type="button" onClick={() => setNewOpen({ box: 1, start: 12 * 60 })} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-crm px-5 py-2.5 font-semibold text-crm-foreground">
            <Plus className="h-4 w-4" /> Новая запись
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Legend />
          <div className="ml-auto flex rounded-lg bg-muted p-0.5">
            <button type="button" aria-pressed="true" onClick={() => changeScheduleView("day")} className="rounded-md bg-crm px-4 py-1.5 font-medium text-crm-foreground">День</button>
            <button type="button" aria-pressed="false" onClick={() => changeScheduleView("week")} className="rounded-md px-4 py-1.5 font-medium text-muted-foreground">Неделя</button>
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

      {section === "schedule" && scheduleView === "day" && (
        <MobileSchedule
          date={date}
          bookings={visible}
          query={query}
          onQueryChange={setQuery}
          onPreviousDay={() => setDate(addDays(date, -1))}
          onNextDay={() => setDate(addDays(date, 1))}
          onToday={() => setDate(today)}
          onShowWeek={() => changeScheduleView("week")}
          onSelect={(id) => { setSelectedId(id); setMobileOrderOpen(true); }}
          onFindFree={(box) => setNewOpen({ box, start: 12 * 60 })}
        />
      )}

      {section === "dashboard" && <MobileDashboard bookings={financeBookings} ops={ops} overrides={overrides} today={DEMO_TODAY} />}
      {section === "finance" && (
        <AdminFinance
          bookings={financeBookings}
          ops={ops}
          overrides={overrides}
          today={DEMO_TODAY}
          onAddOp={(op) => setOps((l) => [...l, op])}
          onRemoveOp={(id) => setOps((l) => l.filter((o) => o.id !== id))}
          onPlanChange={(month, article, amount) =>
            setOverrides((o) => ({ ...o, [month]: { ...o[month], [article]: amount } }))}
        />
      )}

      {section === "schedule" && selected && (
        <OrderPanel
          key={selected.id}
          b={selected}
          onClose={() => setSelectedId(null)}
          onCancel={() => { update(selected.id, cancelBooking); setSelectedId(null); }}
          onUpdate={(fn) => update(selected.id, fn)}
        />
      )}

      {section === "schedule" && selected && mobileOrderOpen && (
        <OrderPanel
          key={`mobile-${selected.id}`}
          mobile
          b={selected}
          onClose={() => setMobileOrderOpen(false)}
          onCancel={() => { update(selected.id, cancelBooking); setMobileOrderOpen(false); }}
          onUpdate={(fn) => update(selected.id, fn)}
        />
      )}

      <MobileAdminNavigation section={section} onChange={changeSection} role={role} onLogout={onLogout} />

      <NewBookingDialog
        open={!!newOpen}
        initial={newOpen}
        date={date}
        bookings={bookings}
        onClose={() => setNewOpen(null)}
        onCreate={async (draft) => {
          const b = await api.createBooking(draft);
          setBookings((l) => [...l, b]);
          setSelectedId(b.id);
          setMobileOrderOpen(true);
          setNewOpen(null);
        }}
      />
    </div>
  );
}

const FIN_KEY = "aquarius-crm-finance";

type AdminSection = "schedule" | "clients" | "services" | "loyalty" | "washers" | "dashboard" | "finance" | "notifications";

/** Owner sees everything the manager sees, plus his own screens (Уведомления — soon). */
const SECTION_ITEMS: Record<CrmRole, { label: string; icon: typeof CalendarDays; target?: AdminSection }[]> = {
  admin: [
    { label: "Расписание", icon: CalendarDays, target: "schedule" },
    { label: "Мойщики", icon: HandCoins, target: "washers" },
    { label: "Клиенты", icon: User, target: "clients" },
    { label: "Лояльность", icon: Star, target: "loyalty" },
    { label: "Услуги", icon: Wrench, target: "services" },
  ],
  owner: [
    { label: "Дашборд", icon: LayoutDashboard, target: "dashboard" },
    { label: "Расписание", icon: CalendarDays, target: "schedule" },
    { label: "Мойщики", icon: HandCoins, target: "washers" },
    { label: "Клиенты", icon: User, target: "clients" },
    { label: "Лояльность", icon: Star, target: "loyalty" },
    { label: "Услуги", icon: Wrench, target: "services" },
    { label: "Финансы", icon: Wallet, target: "finance" },
    { label: "Уведомления", icon: Bell, target: "notifications" },
  ],
};

const ROLE_LABEL: Record<CrmRole, string> = { admin: "Администратор", owner: "Владелец" };

function Sidebar({
  section, onChange, role, onLogout,
}: {
  section: AdminSection;
  onChange: (section: AdminSection) => void;
  role: CrmRole;
  onLogout: () => void;
}) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-crm-surface px-3 py-5 md:flex">
      <div className="px-2">
        <img src={logo.url} alt="Aquarius" width={160} height={62} className="h-11 w-auto" />
        <p className="mt-3 text-muted-foreground">Управление мойкой</p>
      </div>
      <nav className="mt-6 space-y-1">
        {SECTION_ITEMS[role].map(({ label, icon: Icon, target }) => {
          const active = target === section;
          return (
            <button
              key={label}
              type="button"
              disabled={!target}
              title={target ? undefined : "Скоро"}
              onClick={() => target && onChange(target)}
              aria-current={active ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium disabled:cursor-default disabled:text-muted-foreground ${active ? "bg-crm-soft text-crm" : "text-foreground"}`}
            >
              <Icon className="h-5 w-5" /> {label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto space-y-4">
        <span className="flex items-center gap-3 px-3"><CircleHelp className="h-5 w-5" /> Помощь</span>
        <div className="border-t border-border px-2 pt-4">
          <p className="px-1 text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
          <button type="button" onClick={onLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium">
            <LogOut className="h-5 w-5" /> Выйти
          </button>
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
  const { today, nowMin } = useWashClock();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = (14 * 60 - OPEN_MIN) * PX_PER_MIN - 12;
  }, []);
  const height = (CLOSE_MIN - OPEN_MIN) * PX_PER_MIN;
  const showNow = date === today;
  const nowTop = (nowMin - OPEN_MIN) * PX_PER_MIN;
  const pastHeight = date < today ? height : showNow ? nowTop : 0;

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
              <span key={m} className={`absolute right-3 -translate-y-1/2 whitespace-nowrap tabular-nums ${m % 60 ? "text-xs text-muted-foreground" : "text-base"} ${isPastSlot(date, m, today, nowMin) ? "opacity-50" : ""}`} style={{ top: (m - OPEN_MIN) * PX_PER_MIN }}>
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
                const start = OPEN_MIN + Math.round(y / PX_PER_MIN / 15) * 15;
                if (!isPastSlot(date, start, today, nowMin)) onAdd(box, start);
              }}
            >
              {HOURS.map((m) => (
                <div key={m} className="absolute inset-x-0 border-t border-border/60" style={{ top: (m - OPEN_MIN) * PX_PER_MIN }} />
              ))}
              {pastHeight > 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-0 bg-muted/50" style={{ height: pastHeight }} />
              )}
              {HOURS.filter((m) => m + SLOT_MIN <= CLOSE_MIN && !bookings.some((b) => b.box === box && b.wash !== "cancelled" && b.start < m + SLOT_MIN && m < b.start + b.duration)).map((m) => {
                const past = isPastSlot(date, m, today, nowMin);
                return (
                  <button
                    key={`f${m}`}
                    type="button"
                    disabled={past}
                    onClick={() => onAdd(box, m)}
                    aria-label={`${fmtTime(m)}–${fmtTime(m + SLOT_MIN)}, бокс ${box}: ${past ? "время прошло" : "свободно, записать"}`}
                    className={past
                      ? "absolute inset-x-2 flex cursor-default items-center rounded-lg border border-border bg-muted px-3 text-left text-muted-foreground"
                      : "group absolute inset-x-2 flex items-center justify-between rounded-lg border border-dashed border-crm-ok-foreground/60 bg-crm-ok/60 px-3 text-left text-crm-ok-foreground transition-colors hover:border-solid hover:bg-crm-ok"}
                    style={{ top: (m - OPEN_MIN) * PX_PER_MIN + 2, height: SLOT_MIN * PX_PER_MIN - 4 }}
                  >
                    <span>
                      <span className="block font-semibold">{fmtTime(m)} – {fmtTime(m + SLOT_MIN)}</span>
                      <span className="text-xs">{past ? "Время прошло" : "Свободно"}</span>
                    </span>
                    {!past && <span className="flex items-center gap-1 text-xs font-semibold opacity-60 group-hover:opacity-100"><Plus className="h-4 w-4" />Записать</span>}
                  </button>
                );
              })}
              {bookings.filter((b) => b.box === box).map((b) => (
                <BookingCard key={b.id} b={b} selected={b.id === selectedId} onClick={() => onSelect(b.id)} />
              ))}
            </div>
          ))}
          {showNow && (
            <div
              role="img"
              aria-label={`Текущее время ${fmtTime(nowMin)}`}
              className="pointer-events-none absolute inset-x-0 z-20 flex h-0 items-center"
              style={{ top: 12 + nowTop }}
            >
              <ArrowRight className="ml-1 h-5 w-5 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
              <span className="h-0.5 flex-1 -translate-y-1/2 bg-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ b, selected, onClick }: { b: Booking; selected: boolean; onClick: () => void }) {
  const { today, nowMin } = useWashClock();
  const state = bookingState(b, today, nowMin);
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
    { t: "Время прошло", c: "border-border bg-muted" },
    { t: "Сейчас", c: "border-muted-foreground bg-muted-foreground" },
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

function OrderPanel({ b, onClose, onCancel, onUpdate, mobile = false }: { b: Booking; onClose: () => void; onCancel: () => void; onUpdate: (fn: (b: Booking) => Booking) => void; mobile?: boolean }) {
  const { today, nowMin } = useWashClock();
  const [method, setMethod] = useState<PaymentMethod>(b.paymentMethod ?? "terminal");
  const [washer, setWasher] = useState<string | null>(b.washer ?? null);
  const sum = total(b);
  const state = bookingState(b, today, nowMin);
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
    <aside className={mobile ? "fixed inset-0 z-40 flex flex-col bg-background md:hidden" : "hidden w-[380px] shrink-0 flex-col border-l border-border md:flex"}>
      <div className={mobile ? "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-4" : "flex items-center justify-between px-5 pt-5"}>
        {mobile && (
          <button type="button" aria-label="Назад к расписанию" onClick={onClose} className="p-1">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <h2 className={`text-lg font-semibold ${mobile ? "text-center" : ""}`}>Карточка заказа</h2>
        {mobile ? <span className="w-8" /> : (
          <button type="button" aria-label="Закрыть карточку" onClick={onClose} className="p-1"><X className="h-5 w-5" /></button>
        )}
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
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-base font-semibold">Услуги</p>
          <ul className="mt-2 space-y-1.5">
            {b.services.map((s) => (
              <li key={s.name} className="flex items-start justify-between gap-3"><span className="min-w-0 break-words">{s.name}</span><span className="shrink-0 whitespace-nowrap">{rub(s.price)}</span></li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-2"><Clock className="h-4 w-4" /> {b.duration} минут</p>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold">К оплате</span>
            <span className="text-2xl font-bold">{rub(sum)}</span>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          {b.wash === "scheduled" && !b.confirmed && (
            <>
              {needsCall(b, today, nowMin) && (
                <p className="mb-3 flex items-center gap-2 rounded-lg border-2 border-crm-alert-foreground bg-crm-alert p-3 font-medium text-crm-alert-foreground"><Phone className="h-4 w-4" /> Позвоните клиенту: до начала меньше 15 минут</p>
              )}
              <button type="button" onClick={() => onUpdate((x) => confirmBooking(x, today, nowMin))} className="w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Клиент подтвердил</button>
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
              <p className="mt-1">{METHOD_LABEL[b.paymentMethod!]} · {rub(sum)}{b.washer ? ` · ${b.washer}` : ""}</p>
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
              <p className="mt-4 text-base font-semibold">Мойщик</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {WASHERS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWasher(w)}
                    aria-pressed={washer === w}
                    className={`relative rounded-lg border px-1 py-2.5 text-sm font-medium ${washer === w ? "border-2 border-crm bg-crm-soft text-crm" : "border-border"}`}
                  >
                    {washer === w && <Check className="absolute right-1 top-1 h-4 w-4 rounded-full bg-crm p-0.5 text-crm-foreground" />}
                    {w}
                  </button>
                ))}
              </div>
              {method === "terminal" && (
                <>
                  <button type="button" disabled={!washer} onClick={() => onUpdate((x) => applyPayment(x, "terminal", washer ?? undefined))} className="mt-3 w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground disabled:opacity-50">Подтвердить оплату</button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">Нажмите после успешной оплаты на терминале.</p>
                </>
              )}
              {method === "cash" && (
                <button type="button" disabled={!washer} onClick={() => onUpdate((x) => applyPayment(x, "cash", washer ?? undefined))} className="mt-3 w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground disabled:opacity-50">Подтвердить получение наличных</button>
              )}
              {method === "app" && (b.payment === "awaiting" ? (
                <>
                  <p className="mt-3 rounded-lg bg-crm-money p-3 text-center font-medium text-crm-money-foreground">Ожидает оплаты в приложении</p>
                  <button type="button" disabled={!washer} onClick={() => onUpdate((x) => receivePayment(x, washer ?? undefined))} className="mt-3 w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground disabled:opacity-50">Оплата поступила</button>
                </>
              ) : (
                <button type="button" onClick={() => onUpdate((x) => applyPayment(x, "app", washer ?? undefined))} className="mt-3 w-full rounded-lg bg-crm py-3 text-base font-semibold text-crm-foreground">Выставить счёт</button>
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
  onCreate: (b: NewBooking) => Promise<void>;
}) {
  const { today, nowMin } = useWashClock();
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [carPick, setCarPick] = useState<{ cls: 1 | 2 | 3 | 4; body: string } | null>(null);
  const [hits, setHits] = useState<CarHit[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogService[] | null>(null);
  const [pkgName, setPkgName] = useState("Комфорт");
  const [extras, setExtras] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const [slot, setSlot] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSlot(null);
      setPhone(initial?.phone ?? ""); setCar(initial?.car ?? ""); setPkgName("Комфорт"); setExtras([]);
      setCustomName(""); setCustomPrice(""); setCustomMinutes(""); setError(""); setCarPick(null); setHits(null);
    }
  }, [open, initial]);
  useEffect(() => { if (open && !catalog) api.prices().then(setCatalog, () => {}); }, [open, catalog]);
  useEffect(() => {
    const q = car.trim();
    if (!open || carPick || q.length < 2) { setHits(null); return; }
    let alive = true;
    const t = setTimeout(() => api.searchCars(q).then((r) => alive && setHits(r), () => alive && setHits([])), 250);
    return () => { alive = false; clearTimeout(t); };
  }, [car, carPick, open]);
  const pickCar = (h: CarHit) => {
    setHits(null); setCar(h.name);
    api.carInfo(h.modelId).then((i) => setCarPick(i), () => setError("Не удалось определить класс машины."));
  };
  const cls = carPick?.cls ?? 1;

  const isCustom = pkgName === CUSTOM_PACKAGE_NAME;
  const pkg = PACKAGES.find((p) => p.name === pkgName);
  const chosenExtras = EXTRAS.filter((e) => extras.includes(e.name));
  const customPriceValue = Number(customPrice);
  const custom = customServiceDetails(customName, customPriceValue, Number(customMinutes));
  const services = isCustom ? custom.services : pkg
    ? [{ name: `Комплекс «${pkg.name}»`, price: classPrice(catalog, pkg.name, cls, pkg.price) },
      ...chosenExtras.map(({ name, price }) => ({ name, price: classPrice(catalog, name, cls, price) }))]
    : [];
  const duration = isCustom ? custom.duration : bookingDuration(SLOT_MIN, chosenExtras.map((e) => e.minutes));
  const slots = duration > 0 ? freeSlots(bookings, date, duration, 60, today, nowMin) : [];
  const picked = slots.find((s) => s.start === slot);

  const submit = () => {
    if (!car.trim() || !carPick) return setError("Выберите автомобиль из списка.");
    if (phone.length !== 10) return setError("Введите номер телефона полностью: +7 (___) ___-__-__.");
    if (isCustom && !customName.trim()) return setError("Укажите название услуги.");
    if (isCustom && (!Number.isInteger(customPriceValue) || customPriceValue <= 0)) return setError("Укажите цену услуги в рублях.");
    if (isCustom && (!Number.isInteger(duration) || duration <= 0)) return setError("Укажите длительность услуги в минутах.");
    if (!picked) return setError("Выберите свободное время.");
    setBusy(true);
    setError("");
    onCreate({
      date, box: picked.box, start: picked.start, duration, car: car.trim(), carType: carPick.body,
      phone, packageName: isCustom ? custom.packageName : pkg?.name ?? "", services,
    }).catch((e: Error) => setError(e.message)).finally(() => setBusy(false));
  };

  const field = "min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-crm sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="left-0 top-0 h-[100dvh] max-w-none translate-x-0 translate-y-0 gap-5 overflow-y-auto rounded-none p-5 pt-6 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:gap-4 sm:rounded-lg sm:p-6"
        closeClassName="right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background sm:right-4 sm:top-4 sm:h-8 sm:w-8 sm:border-0 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-4 sm:[&_svg]:w-4"
      >
        <DialogHeader className="pr-12 text-left sm:pr-0"><DialogTitle className="text-xl leading-tight sm:text-lg">Новая запись · {fmtDateShort(date)}</DialogTitle></DialogHeader>
        <div className="space-y-4 pb-4 text-base sm:space-y-3 sm:pb-0 sm:text-sm">
          <input aria-label="Телефон клиента" type="tel" inputMode="tel" className={field} placeholder="+7 (___) ___-__-__" value={fmtPhone(phone)}
            onChange={(e) => {
              const raw = e.target.value;
              // deleting a formatting char (")", " ", "-") should remove the previous digit
              const d = raw.length < fmtPhone(phone).length && phoneDigits(raw) === phone ? phone.slice(0, -1) : phoneDigits(raw);
              setPhone(d);
            }} />
          <div className="relative">
            <input aria-label="Автомобиль" className={field} placeholder="Марка или модель" value={car}
              onChange={(e) => { setCar(e.target.value); setCarPick(null); }} />
            {carPick && <p className="mt-1 text-muted-foreground">{carPick.body} · {CLASS_LABEL[carPick.cls]} класс</p>}
            {hits && (
              <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg sm:rounded-lg">
                {hits.length === 0 ? <li className="px-4 py-3 text-muted-foreground sm:px-3 sm:py-2">Ничего не найдено</li> : hits.map((h) => (
                  <li key={h.modelId}><button type="button" onClick={() => pickCar(h)} className="min-h-12 w-full px-4 py-3 text-left hover:bg-muted sm:min-h-0 sm:px-3 sm:py-2">{h.name}</button></li>
                ))}
              </ul>
            )}
          </div>
          <select aria-label="Комплекс мойки" className={field} value={pkgName} onChange={(e) => { setPkgName(e.target.value); setSlot(null); }}>
            {PACKAGES.map((p) => <option key={p.name} value={p.name}>{p.name} · {rub(classPrice(catalog, p.name, cls, p.price))}</option>)}
            <option value={CUSTOM_PACKAGE_NAME}>{CUSTOM_PACKAGE_NAME}</option>
          </select>
          {isCustom ? (
            <div className="space-y-3">
              <textarea
                aria-label="Название услуги"
                className="min-h-28 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-crm sm:min-h-24 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
                placeholder="Название услуги"
                rows={3}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <input
                aria-label="Цена услуги"
                type="text"
                inputMode="numeric"
                className={field}
                placeholder="Цена, ₽"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value.replace(/\D/g, "").slice(0, 7))}
              />
              <input
                aria-label="Время услуги в минутах"
                type="text"
                inputMode="numeric"
                className={field}
                placeholder="Время, минут"
                value={customMinutes}
                onChange={(e) => { setCustomMinutes(e.target.value.replace(/\D/g, "").slice(0, 4)); setSlot(null); }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              {EXTRAS.map((e) => {
                const on = extras.includes(e.name);
                return (
                  <button key={e.name} type="button" onClick={() => { setSlot(null); setExtras((l) => on ? l.filter((x) => x !== e.name) : [...l, e.name]); }}
                    className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm sm:min-h-0 sm:rounded-full sm:px-3 sm:py-1 sm:text-xs ${on ? "border-crm bg-crm-soft text-crm" : "border-border"}`}>
                    {e.name} · {rub(classPrice(catalog, e.name, cls, e.price))}{e.minutes ? ` +${e.minutes} мин` : ""}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <p className="mb-2 font-medium">Свободное время{duration > 0 ? ` · ${duration} минут` : ""}</p>
            {slots.length === 0 ? (
              <p className="text-muted-foreground">{isCustom && duration <= 0 ? "Укажите длительность, чтобы увидеть свободное время." : "На этот день свободных слотов нет."}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button key={s.start} type="button" onClick={() => setSlot(s.start)}
                    className={`min-h-12 rounded-xl border px-2 py-3 text-base font-medium sm:min-h-0 sm:rounded-lg sm:py-2 sm:text-sm sm:font-normal ${slot === s.start ? "border-crm bg-crm text-crm-foreground" : "border-border"}`}>
                    {fmtTime(s.start)}
                  </button>
                ))}
              </div>
            )}
            {picked && <p className="mt-2 text-muted-foreground">Бокс {picked.box} назначен автоматически</p>}
          </div>
          <p className="text-muted-foreground">Итого: <b className="text-foreground">{rub(services.reduce((s, x) => s + x.price, 0))}</b></p>
          {error && <p className="text-destructive">{error}</p>}
          <button type="button" disabled={busy} onClick={submit} className="disabled:opacity-60 min-h-14 w-full rounded-xl bg-crm px-4 py-4 text-base font-semibold text-crm-foreground sm:min-h-0 sm:rounded-lg sm:py-2.5 sm:text-sm">Создать запись</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

