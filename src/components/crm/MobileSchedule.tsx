import { useMemo, useState } from "react";
import {
  Bell, Building2, CalendarDays, ChevronLeft, ChevronRight, HandCoins, LayoutDashboard, Menu, Plus, Search, Star, User, Wallet, Wrench,
  LogOut,
} from "lucide-react";
import { aquarius_logo as logo } from "@/assets/images";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { TONE } from "@/components/crm/booking-tone";
import { bookingState, fmtDateShort, fmtTime, rub, total } from "@/lib/crm/logic";
import { useWashClock } from "@/lib/crm/use-wash-clock";
import { SOURCE_LABEL, type Booking, type CrmRole } from "@/lib/crm/types";
import { STATE_LABEL } from "@/lib/crm/logic";

export type MobileAdminSection =
  | "schedule" | "clients" | "services" | "loyalty" | "washers" | "dashboard" | "finance" | "notifications";

type NavItem = { id: MobileAdminSection | "more"; label: string; Icon: typeof CalendarDays };
type SheetItem = { id: MobileAdminSection; label: string; Icon: typeof CalendarDays; soon?: boolean };

/** Four buttons fit the phone: the owner gets Дашборд in the bar, the rest goes under «Ещё». */
const NAV: Record<CrmRole, NavItem[]> = {
  admin: [
    { id: "schedule", label: "Расписание", Icon: CalendarDays },
    { id: "clients", label: "Клиенты", Icon: User },
    { id: "loyalty", label: "Лояльность", Icon: Star },
    { id: "more", label: "Ещё", Icon: Menu },
  ],
  owner: [
    { id: "dashboard", label: "Дашборд", Icon: LayoutDashboard },
    { id: "schedule", label: "Расписание", Icon: CalendarDays },
    { id: "clients", label: "Клиенты", Icon: User },
    { id: "more", label: "Ещё", Icon: Menu },
  ],
};

const MORE: Record<CrmRole, SheetItem[]> = {
  admin: [
    { id: "washers", label: "Мойщики", Icon: HandCoins },
    { id: "services", label: "Услуги", Icon: Wrench },
  ],
  owner: [
    { id: "washers", label: "Мойщики", Icon: HandCoins },
    { id: "loyalty", label: "Лояльность", Icon: Star },
    { id: "services", label: "Услуги", Icon: Wrench },
    { id: "finance", label: "Финансы", Icon: Wallet },
    { id: "notifications", label: "Уведомления", Icon: Bell },
  ],
};


export function MobileAdminHeader({ role = "admin" }: { role?: CrmRole }) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
      <img src={logo.url} alt="Aquarius" className="h-11 w-auto" />
      <div className="ml-auto flex items-center gap-2">
        <AdminNotificationIndicator />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crm font-semibold text-crm-foreground">{role === "owner" ? "В" : "А"}</span>
      </div>
    </header>
  );
}

export function MobileAdminNavigation({
  section,
  onChange,
  role,
  onLogout,
}: {
  section: MobileAdminSection;
  onChange: (section: MobileAdminSection) => void;
  role: CrmRole;
  onLogout: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav aria-label="Разделы CRM" className="grid shrink-0 grid-cols-4 border-t border-border bg-background px-2 py-2 md:hidden">
        {NAV[role].map(({ id, label, Icon }) => {
          const active = id === "more" ? moreOpen : section === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => (id === "more" ? setMoreOpen((v) => !v) : onChange(id))}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-xs ${active ? "bg-crm-soft font-semibold text-crm" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="w-full rounded-t-2xl border-t border-border bg-background px-4 pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
            <span className="mx-auto block h-1 w-10 rounded-full bg-muted" />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">Разделы</p>
            <div className="mt-1 space-y-1">
              {MORE[role].map(({ id, label, Icon, soon }) => (
                <button
                  key={id}
                  type="button"
                  disabled={soon}
                  title={soon ? "Скоро" : undefined}
                  onClick={() => { onChange(id); setMoreOpen(false); }}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium disabled:text-muted-foreground ${section === id ? "bg-crm-soft text-crm" : ""}`}
                >
                  <Icon className="h-5 w-5 shrink-0" /> {label}
                  {soon && <span className="ml-auto text-xs font-normal">Скоро</span>}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => { setMoreOpen(false); onLogout(); }}
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium"
              >
                <LogOut className="h-5 w-5 shrink-0" /> Выйти · {role === "owner" ? "Владелец" : "Администратор"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileSchedule({
  date,
  bookings,
  query,
  onQueryChange,
  onPreviousDay,
  onNextDay,
  onToday,
  onShowWeek,
  onSelect,
  onFindFree,
}: {
  date: string;
  bookings: Booking[];
  query: string;
  onQueryChange: (query: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onShowWeek: () => void;
  onSelect: (id: string) => void;
  onFindFree: (box: 1 | 2) => void;
}) {
  const [box, setBox] = useState<1 | 2>(1);
  const boxBookings = useMemo(
    () => bookings.filter((booking) => booking.box === box).sort((a, b) => a.start - b.start),
    [bookings, box],
  );
  const weekday = new Date(`${date}T12:00:00`)
    .toLocaleDateString("ru-RU", { weekday: "short" })
    .replace(".", "");

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 md:hidden">
      <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>

      <div className="mt-3 flex rounded-lg bg-muted p-0.5">
        <button type="button" aria-pressed="true" className="min-h-11 flex-1 rounded-md bg-crm px-4 font-medium text-crm-foreground">День</button>
        <button type="button" aria-pressed="false" onClick={onShowWeek} className="min-h-11 flex-1 rounded-md px-4 font-medium text-muted-foreground">Неделя</button>
      </div>

      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
        <button type="button" aria-label="Предыдущий день" onClick={onPreviousDay} className="rounded-lg border border-border bg-background p-2.5">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToday} className="min-w-0 rounded-lg bg-background px-2 py-2.5 text-sm font-semibold shadow-sm">
          <span className="block truncate">{fmtDateShort(date)} {date.slice(0, 4)}, {weekday}</span>
        </button>
        <button type="button" aria-label="Следующий день" onClick={onNextDay} className="rounded-lg border border-border bg-background p-2.5">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Вернуться к сегодняшнему дню" onClick={onToday} className="rounded-lg border border-border bg-background p-2.5">
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Телефон или автомобиль"
          aria-label="Поиск в мобильном расписании"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 rounded-lg bg-background p-1 shadow-sm">
        {([1, 2] as const).map((boxId) => (
          <button
            key={boxId}
            type="button"
            onClick={() => setBox(boxId)}
            aria-pressed={box === boxId}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${box === boxId ? "bg-crm-soft text-crm" : "text-muted-foreground"}`}
          >
            Бокс {boxId}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Работаем 10:00–22:00</p>

      <button type="button" onClick={() => onFindFree(box)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-crm px-4 py-3 text-sm font-semibold text-crm-foreground">
        <Plus className="h-4 w-4" /> Новая запись
      </button>

      <section aria-label={`Записи, бокс ${box}`} className="mt-4 space-y-3">
        {boxBookings.map((booking) => (
          <MobileBookingCard key={booking.id} booking={booking} onClick={() => onSelect(booking.id)} />
        ))}
        {boxBookings.length === 0 && (
          <div className="rounded-xl border border-border bg-background px-4 py-8 text-center">
            <p className="font-medium">Записей нет</p>
            <p className="mt-1 text-sm text-muted-foreground">В этом боксе время пока свободно.</p>
          </div>
        )}
      </section>

      <button type="button" onClick={() => onFindFree(box)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-crm bg-background px-4 py-3 text-sm font-semibold text-crm">
        <Search className="h-4 w-4" /> Найти свободное время
      </button>
    </main>
  );
}

function MobileBookingCard({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const { today, nowMin } = useWashClock();
  const state = bookingState(booking, today, nowMin);
  const tone = TONE[state];
  const { Icon } = tone;
  const extras = booking.services.length - 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative block w-full rounded-xl p-4 pr-8 text-left shadow-sm ${tone.card}`}
      aria-label={`${booking.car}, ${fmtTime(booking.start)}–${fmtTime(booking.start + booking.duration)}, ${STATE_LABEL[state]}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-sm font-bold tabular-nums">{fmtTime(booking.start)}–{fmtTime(booking.start + booking.duration)}</span>
        <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${tone.badge}`}>
          <Icon className="h-3 w-3" /> {STATE_LABEL[state]}
        </span>
      </div>
      <span className="mt-1 block truncate text-base font-bold">{booking.car}</span>
      <span className="mt-0.5 block truncate text-xs opacity-80">
        {booking.packageName}{extras > 0 ? ` + ${extras} доп.` : ""}
      </span>
      <span className="mt-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs ${tone.chip}`}>{SOURCE_LABEL[booking.source]}</span>
        <span className="text-sm font-bold">{rub(total(booking))}</span>
      </span>
      <ChevronRight className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
    </button>
  );
}

