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

export const MOBILE_SHEET =
  "max-md:inset-0 max-md:left-0 max-md:top-0 max-md:h-[100dvh] max-md:max-h-none max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:content-start max-md:grid-cols-[minmax(0,1fr)] max-md:overflow-x-hidden max-md:gap-5 max-md:rounded-none max-md:border-0 max-md:p-5";

export function MobileBookingBar({ label, step, onBack, onClose }: { label: string; step: number; onBack: () => void; onClose: () => void }) {
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Назад"><ArrowLeft className="h-6 w-6" /></button>
        <div className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" alt="" width={44} height={44} className="h-11 w-11" />
          <span className="font-display text-3xl uppercase">Запись</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть"><X className="h-6 w-6" /></button>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-lg font-semibold">{label}</p>
        <p className="text-sm">Шаг {step} из 4</p>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-lime" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
    </div>
  );
}

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
  onBack,
  extraPrices = [],
}: {
  onBack?: () => void;
  extraPrices?: number[];
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
  const [done, setDone] = useState(false);

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

  const close = () => {
    onOpenChange(false);
    if (done) setTimeout(() => { setDone(false); setStep(1); setCar(null); setSlot(null); setPhone(""); setAgree(false); }, 300);
  };
  const pickCar = (c: CarItem) => {
    setCar(c);
    setQuery("");
    setListOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className={`max-h-[95vh] max-w-3xl overflow-y-auto rounded-3xl p-8 sm:p-10 [&>button:last-child]:hidden ${MOBILE_SHEET}`}>
        <button type="button" onClick={close} aria-label="Закрыть" className="absolute right-6 top-6 max-md:hidden">
          <X className="h-7 w-7" />
        </button>
        {done && car && slot ? (<>
          <div className="md:hidden">
            <div className="flex items-center justify-between">
              <img src={logoAsset.url} alt="aquarius автомойка" className="h-12 w-auto" />
              <button type="button" onClick={close} aria-label="Закрыть"><X className="h-7 w-7" /></button>
            </div>
            <div className="mt-6 flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lime"><Check className="h-8 w-8" strokeWidth={3} /></span>
              <div>
                <DialogTitle className="font-display text-4xl uppercase leading-none">Вы записаны!</DialogTitle>
                <p className="mt-1 text-lg">Ждём вас в Aquarius.</p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-4">
              <CalendarDays className="h-9 w-9 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="font-display text-xl">{WD_FULL[day.getDay()]}, {day.getDate()} {MONTHS_GEN[day.getMonth()]} {day.getFullYear()}</p>
                <p className="font-display text-4xl">{range}</p>
                <p className="mt-1 flex items-center gap-2"><Clock className="h-5 w-5" /> {minutes} минут</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-muted px-5 py-4">
              <p className="text-sm uppercase">Ваша мойка</p>
              <p className="mt-1 flex items-center gap-3 border-b border-foreground/20 pb-3"><Car className="h-6 w-8" strokeWidth={1.5} /> {car.name} · {car.body}</p>
              <div className="space-y-2 border-b border-foreground/20 py-3">
                {[[`Комплекс «${pkgName}»`, price - extraPrices.reduce((a, b) => a + b, 0)] as const, ...extras.map((e, i) => [e, extraPrices[i] ?? 0] as const)].map(([n, p]) => (
                  <div key={n} className="flex items-center gap-3">
                    <Check className="h-5 w-5 shrink-0 text-lime" strokeWidth={3} />
                    <span className="flex-1">{n}</span>
                    <span className="font-display">{rub(p)} ₽</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="font-display text-xl">Итого</span>
                <span className="font-display text-4xl">{rub(price)} ₽</span>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-4">
              <MapPin className="h-8 w-8 shrink-0" strokeWidth={1.5} />
              <div>
                <p>Санкт-Петербург<br />проспект Большевиков, 18к2</p>
                <p className="mt-2 flex items-center gap-3"><span className="rounded-md border border-foreground/40 bg-muted px-2 font-display">P4</span><span className="font-display">Паркинг · 4-й уровень</span></p>
              </div>
            </div>
            <a href={YMAPS} target="_blank" rel="noreferrer" className="btn-lime mt-5 flex items-center justify-center gap-2 rounded-lg py-3 text-lg">Маршрут до въезда <ArrowUpRight className="h-5 w-5" /></a>
            <button type="button" onClick={() => downloadIcs(day, slot, minutes ?? 60, pkgName)} className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-foreground py-3 text-lg font-semibold"><CalendarDays className="h-5 w-5" /> Добавить в календарь</button>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Вопросы по записи?</span>
              <a href="tel:+79045117396" className="flex items-center gap-2 font-display text-base"><Phone className="h-5 w-5" /> +7 (904) 511-73-96</a>
            </div>
            <div className="mt-5 rounded-2xl bg-muted px-5 py-5">
              <p className="font-display text-3xl uppercase leading-tight">Aquarius в вашем телефоне</p>
              <p className="mt-1">Повторяйте запись и копите бонусы.</p>
              <div className="my-4 min-h-[200px]" aria-hidden />
              {[["5%", "бонусами с оплаты"], ["200", "бонусов после первого оплаченного визита"]].map(([v, t]) => (
                <div key={v} className="flex items-center gap-4 py-1">
                  <p className="w-24 font-display text-4xl">{v}</p>
                  <span className="h-10 border-l border-foreground/30" />
                  <p className="text-sm">{t}</p>
                </div>
              ))}
              <p className="mt-3 border-t border-foreground/20 pt-3 text-sm">Бонусами можно оплатить до 20% следующей мойки.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <a href="#" className="flex flex-col rounded-lg border border-foreground bg-background px-3 py-1.5 font-semibold leading-tight">App Store<span className="text-xs font-normal">для iPhone</span></a>
                <a href="#" className="flex flex-col rounded-lg border border-foreground bg-background px-3 py-1.5 font-semibold leading-tight">Google Play<span className="text-xs font-normal">для Android</span></a>
              </div>
            </div>
          </div>
          <div className="max-md:hidden">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-lime"><Check className="h-9 w-9" strokeWidth={3} /></span>
              <DialogTitle className="font-display text-3xl uppercase sm:text-5xl">Вы записаны!</DialogTitle>
            </div>
            <p className="mt-4 text-lg">Спасибо, что выбрали Aquarius! Мы уже ждём вас и вашу машину — подготовим всё к приезду. Если планы изменятся, просто позвоните нам.</p>
            <div className="mt-6 space-y-3 rounded-2xl bg-muted px-7 py-6">
              <p className="font-display text-2xl">{pkgName}{extras.length > 0 ? ` + ${extras.join(" + ").toLowerCase()}` : ""}</p>
              <p className="flex items-center gap-3"><Car className="h-6 w-6" /> {car.name} · {car.body}</p>
              <p className="flex items-center gap-3"><CalendarDays className="h-6 w-6" /> {WD_FULL[day.getDay()]}, {day.getDate()} {MONTHS_GEN[day.getMonth()]} · {range}</p>
              <p className="flex items-center gap-3"><MapPin className="h-6 w-6" /> Большевиков, 18к2 · Паркинг, 4-й уровень</p>
              <p className="flex items-center gap-3"><Phone className="h-6 w-6" /> {fmtPhone(phone)}</p>
              <p className="font-display text-3xl">{rub(price)} ₽</p>
            </div>
            <div className="mt-6 rounded-2xl border border-border px-7 py-6">
              <p className="font-display text-2xl uppercase">Aquarius в вашем телефоне</p>
              <p className="mt-2">Ваш автомобиль, любимая мойка и бонусная карта — всегда под рукой.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[["5%", "бонусами с оплаченной суммы"], ["200", "приветственных бонусов после первого оплаченного визита"], ["до 20%", "стоимости заказа можно оплатить бонусами"]].map(([v, t]) => (
                  <div key={v} className="border-l-2 border-lime pl-3">
                    <p className="font-display text-3xl">{v}</p>
                    <p className="text-sm">{t}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs">1 бонус = 1 ₽. Списание со следующего визита. На комплексы и допы.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="#" className="inline-flex flex-col rounded-lg border border-foreground bg-background px-5 py-1.5 font-semibold leading-tight"><span className="text-[10px] font-normal">Загрузите в</span>App Store</a>
                <a href="#" className="inline-flex flex-col rounded-lg border border-foreground bg-background px-5 py-1.5 font-semibold leading-tight"><span className="text-[10px] font-normal">Доступно в</span>Google Play</a>
              </div>
            </div>
            <button type="button" onClick={close} className="btn-lime mt-6 w-full rounded-lg py-3.5 text-lg font-semibold">Отлично</button>
          </div>
        </>) : (<>
        <MobileBookingBar
          label={step === 1 ? "Автомобиль и время" : "Контакты"}
          step={step === 1 ? 3 : 4}
          onBack={() => (step === 2 ? setStep(1) : onBack ? onBack() : close())}
          onClose={close}
        />
        <div className="flex items-center gap-4 max-md:hidden">
          <img src="/apple-touch-icon.png" alt="" width={64} height={64} className="h-16 w-16" />
          <DialogTitle className="font-display text-4xl uppercase sm:text-5xl">Запись на мойку</DialogTitle>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-6 text-lg max-md:hidden">
          {onBack && (
            <>
              <button type="button" onClick={onBack} className="flex items-center gap-2 pb-2 text-muted-foreground"><Check className="h-5 w-5 text-lime" strokeWidth={3} /> Комплекс</button>
              <ChevronRight className="mb-2 h-5 w-5" />
              <button type="button" onClick={onBack} className="flex items-center gap-2 pb-2 text-muted-foreground"><Check className="h-5 w-5 text-lime" strokeWidth={3} /> Уход</button>
              <ChevronRight className="mb-2 h-5 w-5" />
            </>
          )}
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

        <div className="rounded-2xl bg-muted px-7 py-6 max-md:px-5 max-md:py-4">
          <div className="flex items-start justify-between">
            <p className="text-sm uppercase">{step === 1 ? "Вы выбрали" : "Ваша мойка"}</p>
            <button type="button" onClick={onBack ?? close} className="text-sm underline underline-offset-4">Изменить</button>
          </div>
          <p className="font-display text-3xl max-md:text-2xl">{pkgName}</p>
          {extras.length > 0 && (
            <div className="mt-2 flex flex-col gap-y-1 md:flex-row md:flex-wrap md:gap-x-10">
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
                    <Search className="h-6 w-6 shrink-0" />
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setListOpen(true); }}
                      onFocus={() => setListOpen(true)}
                      placeholder="Начните вводить марку или модель"
                      className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
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
                <div className="mt-3 flex items-center gap-6 rounded-2xl bg-muted px-16 py-7 max-md:flex-col max-md:gap-3 max-md:px-6 max-md:py-12 max-md:text-center">
                  <CalendarClock className="h-12 w-12" strokeWidth={1.5} />
                  <span className="h-12 border-l border-foreground/30 max-md:hidden" />
                  <span className="text-lg max-md:text-muted-foreground">Выберите автомобиль, чтобы увидеть свободное время</span>
                </div>
              ) : (
                <>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-display text-2xl capitalize">{MONTHS[day.getMonth()]} {day.getFullYear()}</p>
                    <span className="flex items-center gap-2 text-sm"><CalendarDays className="h-6 w-6" /> <span className="underline underline-offset-4">Календарь</span></span>
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-1.5 md:gap-2">
                    {days.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setDayIdx(i); setSlot(null); }}
                        className={`rounded-lg py-2 text-center ${i === dayIdx ? "btn-lime" : "border border-foreground/40"}`}
                      >
                        <span className="block text-sm font-semibold">{WD[d.getDay()]}</span>
                        <span className="block font-display text-xl md:text-2xl">{d.getDate()}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 font-display text-xl">Свободное время</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
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
                className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Чтобы связаться с вами по записи</p>
            <label className="mt-5 flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-6 w-6 accent-lime" />
              <span>Согласен на <a href="#" className="underline underline-offset-4">обработку персональных данных</a></span>
            </label>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-start sm:justify-between max-md:sticky max-md:-bottom-5 max-md:-mx-5 max-md:mt-auto max-md:gap-3 max-md:bg-background max-md:px-5 max-md:pb-5 max-md:pt-4">
          <div>
            <div className="flex items-center gap-6 max-md:gap-4">
              <p className="font-display text-4xl max-md:text-3xl">{rub(price)} ₽</p>
              <span className="h-10 border-l border-foreground/30" />
              <span className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5" /> {timeLabel} минут</span>
            </div>
            {step === 1 && !car && <p className="mt-2 text-sm text-muted-foreground">Точная цена зависит от автомобиля</p>}
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="mt-3 flex max-md:hidden items-center gap-2">
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
                onClick={() => setDone(true)}
                className={`w-full rounded-lg py-3.5 text-lg font-semibold ${canConfirm ? "btn-lime" : "cursor-not-allowed bg-muted text-muted-foreground"}`}
              >
                Подтвердить запись
              </button>
            )}
          </div>
        </div>
        </>)}
      </DialogContent>
    </Dialog>
  );
}
