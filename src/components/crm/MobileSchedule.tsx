import { useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Menu, Plus, Search, Star, User,
} from "lucide-react";
import logo from "@/assets/aquarius-logo.webp.asset.json";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { TONE } from "@/components/crm/booking-tone";
import { bookingState, fmtDateShort, fmtTime, rub, total } from "@/lib/crm/logic";
import { DEMO_NOW_MIN, DEMO_TODAY } from "@/lib/crm/mock";
import { SOURCE_LABEL, type Booking } from "@/lib/crm/types";
import { STATE_LABEL } from "@/lib/crm/logic";

export type MobileAdminSection = "schedule" | "clients" | "services" | "loyalty";

export function MobileAdminHeader() {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
      <img src={logo.url} alt="Aquarius" className="h-11 w-auto" />
      <div className="ml-auto flex items-center gap-2">
        <AdminNotificationIndicator />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crm font-semibold text-crm-foreground">А</span>
      </div>
    </header>
  );
}

export function MobileAdminNavigation({
  section,
  onChange,
}: {
  section: MobileAdminSection;
  onChange: (section: MobileAdminSection) => void;
}) {
  const items = [
    { id: "schedule" as const, label: "Расписание", Icon: CalendarDays },
    { id: "clients" as const, label: "Клиенты", Icon: User },
    { id: "loyalty" as const, label: "Лояльность", Icon: Star },
    { id: "services" as const, label: "Ещё", Icon: Menu },
  ];
  return (
    <nav aria-label="Разделы CRM" className="grid shrink-0 grid-cols-4 border-t border-border bg-background px-2 py-2 md:hidden">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={section === id ? "page" : undefined}
          className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-xs ${section === id ? "bg-crm-soft font-semibold text-crm" : "text-muted-foreground"}`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </nav>
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

      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
        <button type="button" aria-label="Предыдущий день" onClick={onPreviousDay} className="rounded-lg border border-border bg-background p-2.5">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToday} className="min-w-0 rounded-lg bg-background px-2 py-2.5 text-sm font-semibold shadow-sm">
          <span className="truncate">{fmtDateShort(date)} {date.slice(0, 4)}, {weekday}</span>
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
  const state = bookingState(booking, DEMO_TODAY, DEMO_NOW_MIN);
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

