import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { addDays, fmtDateLong, fmtDateShort, fmtTime } from "@/lib/crm/logic";
import { summarizeWeek, type FreeInterval } from "@/lib/crm/week";
import type { Booking } from "@/lib/crm/types";

interface Props {
  date: string;
  bookings: Booking[];
  today: string;
  nowMin: number;
  onDateChange: (date: string) => void;
  onOpenDay: (date: string) => void;
  onViewChange: (view: "day" | "week") => void;
}

const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours} ч` : ""}${hours && rest ? " " : ""}${rest ? `${rest} мин` : ""}` || "0 мин";
};
const intervalsLabel = (intervals: FreeInterval[]) =>
  intervals.length ? intervals.map((interval) => `${fmtTime(interval.start)}–${fmtTime(interval.end)}`).join(", ") : "Нет свободного времени";
const dayLabel = (date: string) => {
  const weekday = new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${fmtDateShort(date)}`;
};

export function AdminWeekSchedule({ date, bookings, today, nowMin, onDateChange, onOpenDay, onViewChange }: Props) {
  const days = useMemo(() => summarizeWeek(bookings, date, today, nowMin), [bookings, date, today, nowMin]);
  const title = `${fmtDateShort(days[0]!.date)} — ${fmtDateShort(days[6]!.date)} ${days[6]!.date.slice(0, 4)}`;

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 pb-24 md:bg-background md:px-6 md:pb-6 md:pt-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Расписание</h1>
        <div className="hidden md:block"><AdminNotificationIndicator /></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex w-full rounded-lg bg-muted p-0.5 sm:w-auto">
          <button type="button" aria-pressed="false" onClick={() => onViewChange("day")} className="min-h-11 flex-1 rounded-md px-5 font-medium text-muted-foreground sm:flex-none">День</button>
          <button type="button" aria-pressed="true" className="min-h-11 flex-1 rounded-md bg-crm px-5 font-medium text-crm-foreground sm:flex-none">Неделя</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Предыдущая неделя" onClick={() => onDateChange(addDays(date, -7))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronLeft className="h-5 w-5" /></button>
          <span className="min-w-64 text-center text-lg font-semibold">{title}</span>
          <button type="button" aria-label="Следующая неделя" onClick={() => onDateChange(addDays(date, 7))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background"><ChevronRight className="h-5 w-5" /></button>
          <button type="button" onClick={() => onDateChange(today)} className="min-h-11 rounded-lg border border-border bg-background px-4 font-medium">Текущая неделя</button>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">Нажмите на день, чтобы открыть записи и свободные слоты</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onOpenDay(day.date)}
            aria-label={`Открыть расписание: ${fmtDateLong(day.date)}`}
            className={`rounded-xl border p-4 text-left transition-colors ${day.isToday ? "border-crm bg-crm-soft" : day.isPast ? "border-border bg-muted/50" : "border-border bg-background hover:border-crm"}`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-semibold">{dayLabel(day.date)}</span>
              {day.isToday && <span className="rounded bg-crm px-2 py-0.5 text-xs font-semibold text-crm-foreground">Сегодня</span>}
            </span>
            <span className="mt-3 block text-sm">Записей: {day.bookingCount}</span>
            <span className="mt-1 block text-sm text-muted-foreground">Занято: {durationLabel(day.occupiedMinutes)}</span>
            {day.isPast ? (
              <span className="mt-3 block text-sm text-muted-foreground">Новая запись недоступна</span>
            ) : (
              <span className="mt-3 block space-y-2">
                {([1, 2] as const).map((box) => (
                  <span key={box} className="block text-sm">
                    <span className="block font-medium">Бокс {box}</span>
                    <span className="mt-0.5 block text-muted-foreground">{intervalsLabel(day.free[box])}</span>
                  </span>
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
    </main>
  );
}
