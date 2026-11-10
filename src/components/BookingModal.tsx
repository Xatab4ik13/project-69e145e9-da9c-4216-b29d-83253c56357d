import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CalendarClock, Car, Check, ChevronDown, ChevronRight, Clock, MapPin, Phone, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type CarItem = { name: string; body: string; cls: 1 | 2 | 3 };
// Класс автомобиля влияет на цену и время. Kia Rio — I класс (как на макете).
const CARS: CarItem[] = [
  { name: "Kia Rio", body: "седан", cls: 1 },
  { name: "Hyundai Solaris", body: "седан", cls: 1 },
  { name: "Volkswagen Polo", body: "седан", cls: 1 },
  { name: "Skoda Octavia", body: "лифтбек", cls: 2 },
  { name: "Toyota Camry", body: "седан", cls: 2 },
  { name: "Volkswagen Passat", body: "универсал", cls: 2 },
  { name: "Kia Sportage", body: "кроссовер", cls: 2 },
  { name: "Toyota RAV4", body: "кроссовер", cls: 2 },
  { name: "BMW X5", body: "внедорожник", cls: 3 },
  { name: "Toyota Land Cruiser", body: "внедорожник", cls: 3 },
];
const CLASS_K = { 1: 1, 2: 1.2, 3: 1.4 } as const;
const SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"];
const WD = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const WD_FULL = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const rub = (n: number) => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ");
const addMin = (t: string, m: number) => {
  const [h, mm] = t.split(":").map(Number) as [number, number];
  const total = h * 60 + mm + m;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const fmtPhone = (digits: string) => {
  const d = digits.padEnd(10, "_");
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
};

export function BookingModal({
  open,
  onOpenChange,
  pkgName,
  extras,
  basePrice,
  time,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pkgName: string;
  extras: string[];
  basePrice: number;
  time: [number, number];
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [car, setCar] = useState<CarItem | null>(null);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 + i));
  }, []);
  const day = days[dayIdx]!;
  const matches = CARS.filter((c) => `${c.name} ${c.body}`.toLowerCase().includes(query.trim().toLowerCase()));

  const price = car ? Math.round((basePrice * CLASS_K[car.cls]) / 100) * 100 : basePrice;
  const minutes = car ? (car.cls === 1 ? time[0] : time[1]) : null;
  const timeLabel = minutes ?? (time[0] === time[1] ? time[0] : `${time[0]}–${time[1]}`);
  const range = slot && minutes ? `${slot}–${addMin(slot, minutes)}` : "";
  const canContinue = !!car && !!slot;
  const canConfirm = phone.length === 10 && agree;

  const close = () => onOpenChange(false);
  const pickCar = (c: CarItem) => {
    setCar(c);
    setQuery("");
    setListOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto rounded-3xl p-8 sm:p-10 [&>button:last-child]:hidden">
        <button type="button" onClick={close} aria-label="Закрыть" className="absolute right-6 top-6">
          <X className="h-7 w-7" />
        </button>
        <div className="flex items-center gap-4">
          <img src="/apple-touch-icon.png" alt="" width={64} height={64} className="h-16 w-16" />
          <DialogTitle className="font-display text-4xl uppercase sm:text-5xl">Запись на мойку</DialogTitle>
        </div>

        <div className="mt-2 flex items-center gap-6 text-lg">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 pb-2 ${step === 1 ? "border-b-4 border-lime font-semibold" : "text-muted-foreground"}`}
          >
            {step === 2 && <Check className="h-5 w-5 text-lime" strokeWidth={3} />}
            Автомобиль и время
          </button>
          <ChevronRight className="mb-2 h-5 w-5" />
          <span className={`pb-2 ${step === 2 ? "border-b-4 border-lime font-semibold" : "text-muted-foreground"}`}>Контакты</span>
        </div>

        <div className="rounded-2xl bg-muted px-7 py-6">
          <div className="flex items-start justify-between">
            <p className="text-sm uppercase">{step === 1 ? "Вы выбрали" : "Ваша мойка"}</p>
            <button type="button" onClick={close} className="text-sm underline underline-offset-4">Изменить</button>
          </div>
          <p className="font-display text-3xl">{pkgName}</p>
          {extras.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-10 gap-y-1">
              {extras.map((e) => (
                <span key={e} className="flex items-center gap-2"><Check className="h-5 w-5 text-lime" strokeWidth={3} /> {e}</span>
              ))}
            </div>
          )}
          {step === 2 && car && slot && (
            <div className="mt-4 space-y-3 border-t border-foreground/20 pt-4">
              {[
                [Car, `${car.name} · ${car.body}`],
                [CalendarDays, `${WD_FULL[day.getDay()]}, ${day.getDate()} ${MONTHS_GEN[day.getMonth()]} · ${range}`],
                [MapPin, "Большевиков, 18к2 · Паркинг, 4-й уровень"],
              ].map(([Icon, text], i) => {
                const I = Icon as typeof Car;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <I className="h-7 w-10" />
                    <span className="h-7 border-l border-foreground/30" />
                    <span>{text as string}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {step === 1 ? (
          <>
            <div>
              <p className="font-display text-2xl">Ваш автомобиль</p>
              {car ? (
                <div className="mt-3 flex items-center gap-4 rounded-lg border border-foreground/40 px-5 py-3">
                  <Car className="h-7 w-10" />
                  <span className="h-7 border-l border-foreground/30" />
                  <span className="flex-1 text-lg">{car.name} · {car.body}</span>
                  <button type="button" onClick={() => { setCar(null); setSlot(null); setListOpen(true); }} className="text-sm underline underline-offset-4">Изменить</button>
                </div>
              ) : (
                <div className="relative mt-3">
                  <div className="flex items-center gap-4 rounded-lg border border-foreground/40 px-5 py-3">
                    <Search className="h-6 w-6" />
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setListOpen(true); }}
                      onFocus={() => setListOpen(true)}
                      placeholder="Начните вводить марку или модель"
                      className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setListOpen((o) => !o)} aria-label="Список автомобилей">
                      <ChevronDown className="h-6 w-6" />
                    </button>
                  </div>
                  {listOpen && (
                    <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
                      {matches.length ? matches.map((c) => (
                        <li key={c.name}>
                          <button type="button" onClick={() => pickCar(c)} className="w-full px-5 py-2.5 text-left hover:bg-muted">
                            {c.name} · {c.body}
                          </button>
                        </li>
                      )) : <li className="px-5 py-2.5 text-muted-foreground">Ничего не найдено</li>}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="font-display text-2xl uppercase">Дата и время</p>
              {!car ? (
                <div className="mt-3 flex items-center gap-6 rounded-2xl bg-muted px-16 py-7">
                  <CalendarClock className="h-12 w-12" strokeWidth={1.5} />
                  <span className="h-12 border-l border-foreground/30" />
                  <span className="text-lg">Выберите автомобиль, чтобы увидеть свободное время</span>
                </div>
              ) : (
                <>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-display text-2xl capitalize">{MONTHS[day.getMonth()]} {day.getFullYear()}</p>
                    <span className="flex items-center gap-2 text-sm"><CalendarDays className="h-6 w-6" /> <span className="underline underline-offset-4">Календарь</span></span>
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-2">
                    {days.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setDayIdx(i); setSlot(null); }}
                        className={`rounded-lg py-2 text-center ${i === dayIdx ? "btn-lime" : "border border-foreground/40"}`}
                      >
                        <span className="block text-sm font-semibold">{WD[d.getDay()]}</span>
                        <span className="block font-display text-2xl">{d.getDate()}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 font-display text-xl">Свободное время</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {SLOTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s === slot ? null : s)}
                        className={`flex items-center justify-center gap-2 rounded-lg py-2 text-lg ${s === slot ? "btn-lime" : "border border-foreground/40"}`}
                      >
                        {s === slot && <Check className="h-5 w-5" />} {s}
                      </button>
                    ))}
                  </div>
                  {slot && <p className="mt-3 text-muted-foreground">{day.getDate()} {MONTHS_GEN[day.getMonth()]} · {range}</p>}
                </>
              )}
            </div>
          </>
        ) : (
          <div>
            <p className="font-display text-2xl">Ваш номер телефона</p>
            <div className="mt-3 flex items-center gap-4 rounded-lg border border-foreground/40 px-5 py-3">
              <Phone className="h-6 w-6" />
              <span className="h-7 border-l border-foreground/30" />
              <input
                type="tel"
                inputMode="tel"
                value={phone ? fmtPhone(phone) : ""}
                placeholder="+7 (___) ___-__-__"
                onKeyDown={(e) => {
                  if (e.key === "Backspace") { e.preventDefault(); setPhone((p) => p.slice(0, -1)); }
                }}
                onChange={(e) => {
                  let d = e.target.value.replace(/\D/g, "");
                  if (!phone && (d.startsWith("7") || d.startsWith("8")) && d.length > 1) d = d.slice(1);
                  else if (phone) d = d.slice(1);
                  setPhone(d.slice(0, 10));
                }}
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Чтобы связаться с вами по записи</p>
            <label className="mt-5 flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-6 w-6 accent-lime" />
              <span>Согласен на <a href="#" className="underline underline-offset-4">обработку персональных данных</a></span>
            </label>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-6">
              <p className="font-display text-4xl">{rub(price)} ₽</p>
              <span className="h-10 border-l border-foreground/30" />
              <span className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5" /> {timeLabel} минут</span>
            </div>
            {step === 1 && !car && <p className="mt-2 text-sm text-muted-foreground">Точная цена зависит от автомобиля</p>}
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="mt-3 flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" /> <span className="underline underline-offset-4">Назад</span>
              </button>
            )}
          </div>
          <div className="text-center sm:w-[22rem]">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => setStep(2)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-lg font-semibold ${canContinue ? "btn-lime" : "cursor-not-allowed bg-muted text-muted-foreground"}`}
                >
                  Продолжить <ArrowRight className="h-5 w-5" />
                </button>
                <p className="mt-2 text-sm text-muted-foreground">Далее — номер телефона</p>
              </>
            ) : (
              <button
                type="button"
                disabled={!canConfirm}
                className={`w-full rounded-lg py-3.5 text-lg font-semibold ${canConfirm ? "btn-lime" : "cursor-not-allowed bg-muted text-muted-foreground"}`}
              >
                Подтвердить запись
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
