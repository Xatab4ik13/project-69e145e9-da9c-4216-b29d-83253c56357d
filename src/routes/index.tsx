import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookingModal, MobileBookingBar, MOBILE_SHEET } from "@/components/BookingModal";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, Menu, ChevronRight, Clock, Copy, CornerUpRight, MapPin, Phone, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import imgMap from "@/assets/parking-map-aquarius.webp.asset.json";
import imgParkCar from "@/assets/parking-car-4.webp.asset.json";

const ADDRESS = "Санкт-Петербург, проспект Большевиков, 18к2";
const PHONE = "+7 (904) 511-73-96";
const PHONE_HREF = "tel:+79045117396";
const YMAPS = "https://yandex.ru/maps/?text=" + encodeURIComponent(ADDRESS);

function Contacts() {
  const [copied, setCopied] = useState(false);
  const steps = [
    { icon: <ArrowUp className="h-8 w-8" strokeWidth={3} />, t: "С проспекта Большевиков", d: "Двигайтесь со стороны улицы Дыбенко. Сверните направо в боковой проезд рядом с «Вкусно — и точка»." },
    { icon: <CornerUpRight className="h-8 w-8" strokeWidth={3} />, t: "Во въезд паркинга", d: "Проедьте вдоль здания и поверните направо во въезд паркинга." },
    { icon: <span className="flex h-8 w-8 items-center justify-center rounded-md border-[3px] border-foreground font-display text-lg">P</span>, t: "На 4-й уровень", d: "Поднимитесь на 4-й уровень паркинга. Здесь находится автомойка Aquarius." },
  ];
  return (
    <section id="contacts" className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="md:hidden">
        <h2 className="font-display text-4xl uppercase max-[380px]:text-3xl">Ждём на Большевиков</h2>
        <p className="mt-2 text-lg leading-snug">Санкт-Петербург,<br />проспект Большевиков, <b>18к2</b></p>
        <p className="mt-3 flex items-center gap-3">
          <span className="flex overflow-hidden rounded-md border-2 border-foreground font-display text-xl leading-none"><span className="px-1.5 py-1">P</span><span className="bg-lime px-1.5 py-1">4</span></span>
          <span className="h-7 border-l border-border" />
          <span className="text-lg"><b>Паркинг</b> · 4-й уровень</span>
        </p>
        <p className="mt-3 flex items-center gap-3"><Clock className="h-5 w-5" /> Ежедневно · 10:00–22:00</p>
        <a href={PHONE_HREF} className="mt-2 flex items-center gap-3 font-display text-2xl"><Phone className="h-5 w-5" /> {PHONE}</a>
        <a href={PHONE_HREF} className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-foreground py-2.5 font-semibold"><Phone className="h-4 w-4" /> Позвонить</a>
        <img src={imgMap.url} alt="Схема заезда в паркинг Aquarius: от улицы Дыбенко к въезду, 4-й уровень" width={1280} height={735} loading="lazy" decoding="async" className="mt-5 w-full rounded-xl border border-border" />
        <a href={YMAPS} target="_blank" rel="noreferrer" className="btn-lime mt-3 flex items-center justify-center gap-2 rounded-lg py-3 text-lg">Маршрут до въезда <ArrowUpRight className="h-5 w-5" /></a>
        <h3 className="mt-6 border-t border-border pt-4 font-display text-3xl uppercase">Как нас найти</h3>
        <div className="mt-2 space-y-2">
          <p>Со стороны ул. Дыбенко поверните направо у «Вкусно — и точка».</p>
          <p>Проедьте вдоль здания и поверните направо во въезд паркинга.</p>
          <p>Поднимитесь на 4-й уровень — мы здесь.</p>
        </div>
        <img src={imgParkCar.url} alt="Автомобиль у метки паркинга, 4-й уровень" width={1000} height={315} loading="lazy" decoding="async" className="mt-4 w-full" />
      </div>
      <div className="grid gap-10 max-md:hidden md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em]">Контакты и проезд</p>
          <h2 className="mt-2 font-display text-5xl uppercase">Ждём на Большевиков</h2>
          <p className="btn-lime mt-3 inline-block rounded-lg px-4 py-1 font-display text-2xl uppercase">Автомойка на 4-м уровне паркинга</p>
          <p className="mt-3">Заезд с проспекта Большевиков — маршрут показан на схеме.</p>
          <img src={imgMap.url} alt="Схема заезда в паркинг Aquarius: от улицы Дыбенко к въезду, 4-й уровень" width={1280} height={735} loading="lazy" decoding="async" className="mt-5 w-full rounded-xl border border-border" />
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <a href={YMAPS} target="_blank" rel="noreferrer" className="btn-lime inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm">Маршрут до въезда <ArrowUpRight className="h-4 w-4" /></a>
            <a href={YMAPS} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">Открыть в Яндекс Картах</a>
          </div>
          <div className="mt-5 flex flex-col gap-4 rounded-xl sm:flex-row sm:items-center sm:justify-between border border-border p-4">
            <div>
              <p className="font-display text-2xl">Первый раз у нас?</p>
              <p className="text-sm">Если запутались на подъезде, позвоните — подскажем дорогу.</p>
            </div>
            <div className="flex flex-col items-center gap-1 sm:border-l sm:border-border sm:pl-4">
              <a href={PHONE_HREF} className="inline-flex items-center gap-2 rounded-lg border border-foreground px-6 py-1.5 text-sm font-semibold"><Phone className="h-4 w-4" /> Позвонить</a>
              <button type="button" onClick={() => { navigator.clipboard?.writeText(ADDRESS); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center gap-2 whitespace-nowrap text-sm underline underline-offset-4">
                <Copy className="h-4 w-4" /> {copied ? "Адрес скопирован" : "Скопировать адрес"}
              </button>
            </div>
          </div>
          <img src={imgParkCar.url} alt="Автомобиль у метки паркинга, 4-й уровень" width={1000} height={315} loading="lazy" decoding="async" className="mt-4 w-1/2" />
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em]">Адрес</p>
          <p className="mt-2 font-display text-3xl leading-tight">Санкт-Петербург<br />проспект Большевиков, 18к2</p>
          <p className="btn-lime mt-3 inline-block rounded-lg px-4 py-1 font-display text-xl">Паркинг · 4-й уровень</p>
          <p className="mt-3 flex items-center gap-2"><Clock className="h-5 w-5" /> Ежедневно · 10:00–22:00</p>
          <div className="mt-6 border-t border-border pt-6">
            <a href={PHONE_HREF} className="font-display text-4xl">{PHONE}</a>
            <a href={PHONE_HREF} className="mt-3 flex w-64 items-center justify-center gap-2 rounded-lg border border-foreground py-2 text-sm font-semibold"><Phone className="h-4 w-4" /> Позвонить</a>
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-display text-3xl uppercase">Как заехать</h3>
            {steps.map((s, i) => (
              <div key={s.t} className={`flex gap-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="shrink-0 border-r border-border pr-4">{s.icon}</div>
                <div>
                  <p className="font-display text-xl">{s.t}</p>
                  <p className="text-sm">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-5 max-md:px-4">
      <img src={logo.url} alt="Aquarius автомойка" width={160} height={64} loading="lazy" className="h-12 w-auto" />
      <nav className="flex gap-8 text-sm font-semibold max-md:text-xs max-md:underline max-md:underline-offset-4">
        <a href="#" className="max-md:hidden">Услуги</a>
        <a href="#contacts" className="max-md:hidden">Контакты</a>
        <a href="#">Политика конфиденциальности</a>
      </nav>
    </footer>
  );
}
import imgFoam from "@/assets/care-foam-wash.webp.asset.json";
import imgWax from "@/assets/care-quartz-wax.webp.asset.json";
import imgRain from "@/assets/care-antirain.webp.asset.json";
import imgTire from "@/assets/care-tire-black.webp.asset.json";
import imgLeather from "@/assets/care-leather.webp.asset.json";
import imgTrunk from "@/assets/care-trunk-vacuum.webp.asset.json";
import logo from "@/assets/aquarius-logo.webp.asset.json";
import hero from "@/assets/car-wash-hero.webp.asset.json";
import imgDry from "@/assets/more-dry-clean.webp.asset.json";
import imgEngine from "@/assets/more-engine.webp.asset.json";
import imgWheels from "@/assets/more-wheels.webp.asset.json";

const moreCare = [
  { img: imgDry, alt: "Химчистка тканевого кресла", name: "Химчистка салона", info: "от 17 000 ₽ · 12 часов", note: "Запись до 13:00 предыдущего дня" },
  { img: imgEngine, alt: "Мойка моторного отсека", name: "Мойка двигателя", info: "2 000 ₽ · 40 минут" },
  { img: imgWheels, alt: "Чистка диска щёткой", name: "Чистка дисков", info: "500 ₽ за диск · 15 минут" },
];

function MoreCare() {
  return (
    <section className="mx-auto max-w-6xl border-t border-border px-4 pt-8 md:px-6">
      <h2 className="font-display text-4xl uppercase">Больше ухода</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {moreCare.map((m, i) => (
          <div key={m.name} className={`flex items-center gap-4 ${i > 0 ? "max-md:border-t max-md:border-border max-md:pt-4 md:border-l md:border-border md:pl-6" : ""}`}>
            <img src={m.img.url} alt={m.alt} width={480} height={320} loading="lazy" decoding="async" className="w-2/5 shrink-0 rounded-xl object-cover max-md:w-1/3" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl uppercase leading-tight">{m.name}</h3>
              <p className="mt-1 text-sm">{m.info}</p>
              {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AppPromo() {
  const stats = [
    { v: "5%", t: "бонусами с оплаченной суммы" },
    { v: "200", t: "приветственных бонусов после первого оплаченного визита" },
    { v: "до 20%", t: "стоимости заказа можно оплатить бонусами" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="grid gap-8 rounded-2xl bg-muted p-8 max-md:gap-4 max-md:p-4 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-4xl uppercase">Aquarius в вашем телефоне</h2>
          <p className="mt-2 max-md:hidden">Ваш автомобиль, любимая мойка и бонусная карта — всегда под рукой.</p>
          <div className="mt-6 grid grid-cols-3 gap-4 max-md:mt-0 max-md:grid-cols-1 max-md:gap-0">
            {stats.map((s, i) => (
              <div key={s.v} className={`max-md:grid max-md:grid-cols-[6rem_1fr] max-md:items-center max-md:gap-3 max-md:border-b max-md:border-border max-md:py-2 ${i > 0 ? "md:border-l md:border-border md:pl-4" : ""}`}>
                <p className="font-display text-4xl max-md:border-r max-md:border-border">{s.v}</p>
                <p className="text-sm">{s.t}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs">1 бонус = 1 ₽. Списание со следующего визита. На комплексы и допы.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 max-md:mt-4 max-md:grid max-md:grid-cols-2 max-md:gap-3">
            <a href="#" className="inline-flex flex-col rounded-lg border border-foreground bg-background px-5 py-1.5 font-semibold leading-tight"><span className="text-[10px] font-normal">Загрузите в</span>App Store</a>
            <a href="#" className="inline-flex flex-col rounded-lg border border-foreground bg-background px-5 py-1.5 font-semibold leading-tight"><span className="text-[10px] font-normal">Доступно в</span>Google Play</a>
            <ul className="space-y-1 text-sm max-md:hidden sm:border-l sm:border-border sm:pl-4">
              <li>Сохранённые автомобили</li>
              <li>Повтор прошлой мойки</li>
              <li>История визитов</li>
            </ul>
          </div>
        </div>
        <div className="min-h-[320px] max-md:order-first max-md:min-h-[200px]" aria-hidden="true" />
      </div>
    </section>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Автомойка Аквариус на Большевиков — запись онлайн" },
      {
        name: "description",
        content:
          "Автомойка Aquarius на Большевиков, 18к2. Выберите мойку и уход, узнайте стоимость и время до записи. Ежедневно 10:00–22:00.",
      },
      { property: "og:title", content: "Автомойка Аквариус на Большевиков" },
      {
        property: "og:description",
        content: "Выберите мойку и нужный уход. Стоимость и время — до записи.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: hero.url, fetchpriority: "high" }],
  }),
  component: Index,
});

const nav = ["Услуги", "Приложение", "Как проехать"];

function Index() {
  const [headerBooking, setHeaderBooking] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-6 border-b border-border px-6 py-3 max-md:gap-3 max-md:px-4 max-md:border-b-0">
        <a href="/" aria-label="Aquarius — автомойка">
          <img src={logo.url} alt="Логотип автомойки Aquarius" width={160} height={62} className="h-12 w-auto" />
        </a>
        <nav className="hidden items-center gap-10 text-sm font-semibold md:flex">
          {nav.map((n) => (
            <a key={n} href="#" className="transition-colors hover:text-muted-foreground">
              {n}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-6 max-md:gap-3">
          <button type="button" onClick={() => setHeaderBooking(true)} className="btn-lime rounded-lg px-5 py-2.5 text-sm max-md:px-3 max-md:py-2">
            Записаться
          </button>
          <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Меню" className="md:hidden">
            {menu ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
          {menu && (
            <nav className="absolute inset-x-0 top-full z-20 flex flex-col border-y border-border bg-background px-4 py-2 text-base font-semibold md:hidden">
              {nav.map((n) => (
                <a key={n} href={n === "Как проехать" ? "#contacts" : "#"} onClick={() => setMenu(false)} className="py-2.5">{n}</a>
              ))}
            </nav>
          )}
          <HeaderBooking open={headerBooking} onOpenChange={setHeaderBooking} />
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-5 border-b border-border px-4 pb-8 pt-4 md:grid md:grid-cols-[1fr_1.4fr] md:items-center md:gap-8 md:px-6 md:py-10">
        <div className="max-md:contents">
          <h1 className="order-1 font-display text-5xl uppercase leading-[0.95] max-[380px]:text-4xl md:text-6xl">
            Автомойка
            <br />
            <span className="whitespace-nowrap">на Большевиков</span>
          </h1>
          <p className="order-1 -mt-2 text-base leading-snug md:mt-4">
            Выберите мойку и нужный уход.
            <br />
            Стоимость и время — до записи.
          </p>
          <a href="#" className="btn-lime order-3 inline-flex items-center justify-center gap-3 rounded-lg px-7 py-3 text-base max-md:py-3.5 max-md:text-xl md:mt-6">
            Выбрать мойку <ArrowUpRight className="h-4 w-4" />
          </a>
          <p className="order-3 mt-6 flex items-center gap-2 text-sm max-md:hidden">
            <MapPin className="h-4 w-4" /> Большевиков, 18к2 · Ежедневно <b>10:00–22:00</b>
          </p>
          <div className="order-3 space-y-2 border-b border-border pb-2 text-base md:hidden">
            <p className="flex items-center gap-3"><MapPin className="h-5 w-5" /> Большевиков, 18к2 · 4-й уровень</p>
            <p className="flex items-center gap-3"><Clock className="h-5 w-5" /> Ежедневно 10:00–22:00</p>
          </div>
        </div>
        <img
          src={hero.url}
          alt="Универсал в пене под струёй воды из мойки высокого давления"
          width={1400}
          height={667}
          fetchPriority="high"
          decoding="async"
          className="order-2 h-auto w-full"
        />
      </section>

      <Configurator />
      <MoreCare />
      <AppPromo />
      <Contacts />
      <SiteFooter />
    </div>
  );
}

const packages = [
  { name: "Стандарт", price: 1200, time: [40, 60] as [number, number], items: ["Кузов пеной", "Сушка", "Мойка ковров"] },
  { name: "Комфорт", price: 1600, time: [50, 60] as [number, number], items: ["Всё из «Стандарта»", "Пылесос салона"] },
  { name: "Люкс", price: 1900, time: [80, 80] as [number, number], items: ["Всё из «Комфорта»", "Очистка стёкол", "Очистка пластика"] },
];

type Cat = "body" | "salon";
const care = [
  { id: "wax", name: "Кварцевый воск", short: "кварцевый воск", price: 600, extra: 0, desc: "Защитная обработка кузова", img: imgWax, cat: "body" as Cat, alt: "Нанесение кварцевого воска на капот" },
  { id: "rain", name: "Антидождь", short: "антидождь", price: 2100, extra: 20, desc: "Обработка передней полусферы", img: imgRain, cat: "body" as Cat, alt: "Лобовое стекло в каплях дождя" },
  { id: "tire", name: "Чернение резины", short: "чернение резины", price: 300, extra: 0, desc: "Ухоженный вид шин", img: imgTire, cat: "body" as Cat, alt: "Чернение боковины шины" },
  { id: "leather", name: "Кондиционер кожи", short: "кондиционер кожи", price: 600, extra: 10, desc: "Уход за кожаным салоном", img: imgLeather, cat: "salon" as Cat, alt: "Уход за кожаным сиденьем" },
  { id: "trunk", name: "Пылесос багажника", short: "пылесос багажника", price: 300, extra: 10, desc: "Уборка багажного отделения", img: imgTrunk, cat: "salon" as Cat, alt: "Очистка багажника пылесосом" },
];
const phases = [
  { id: "two", label: "Две фазы", short: "две фазы", price: 500 },
  { id: "three", label: "Три фазы", short: "три фазы", price: 800 },
];

const rub = (n: number) => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ");

function Configurator() {
  const [selected, setSelected] = useState(1);
  const [added, setAdded] = useState<string[]>(["wax", "tire"]);
  const [phase, setPhase] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Cat>("all");
  const [booking, setBooking] = useState(false);

  const pkg = packages[selected] ?? packages[0]!;
  const chosen = care.filter((c) => added.includes(c.id));
  const ph = phases.find((p) => p.id === phase);
  const total = pkg.price + chosen.reduce((a, c) => a + c.price, 0) + (ph?.price ?? 0);
  const extra = chosen.reduce((a, c) => a + c.extra, 0);
  const [tMin, tMax] = [pkg.time[0] + extra, pkg.time[1] + extra];
  const summary = [pkg.name, ...(ph ? [ph.short] : []), ...chosen.map((c) => c.short)].join(" + ");
  const toggle = (id: string) => setAdded((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const show = (cat: Cat) => filter === "all" || filter === cat;

  return (
    <>
      <section className="mx-auto max-w-6xl border-b border-border px-4 py-8 md:px-6 md:py-10">
        <h2 className="font-display text-4xl uppercase max-[380px]:text-3xl md:text-5xl">Выберите комплекс</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {packages.map((p, i) => {
            const active = i === selected;
            return (
              <div
                key={p.name}
                className={`relative grid grid-cols-2 gap-x-4 rounded-xl p-4 max-md:border max-md:border-border md:flex md:flex-col md:p-6 ${active ? "bg-muted" : ""} ${i > 0 && !active && selected !== i - 1 ? "md:border-l md:border-border" : ""}`}
              >
                {active && (
                  <span className="btn-lime absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                <div>
                  <h3 className="font-display text-3xl uppercase">{p.name}</h3>
                  <p className="mt-1 font-display text-3xl max-md:text-2xl">от {rub(p.price)} ₽</p>
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" /> {p.time[0] === p.time[1] ? p.time[0] : `${p.time[0]}–${p.time[1]}`} мин<span className="max-md:hidden">ут</span>
                  </p>
                </div>
                <ul className="mt-3 flex-1 space-y-1 text-sm max-md:mt-1 max-md:self-center max-md:border-l max-md:border-border max-md:pl-3 max-md:pr-8">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-center gap-2">
                      <Check className="h-4 w-4" /> {it}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`col-span-2 mt-5 rounded-lg py-2.5 text-sm font-semibold max-md:mt-4 max-md:text-base ${active ? "btn-lime" : "border border-foreground bg-background"}`}
                >
                  {active ? "Выбрано" : "Выбрать"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs">Сушка включена во время комплекса.</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-4xl uppercase md:text-5xl">Добавьте уход</h2>
          <div className="flex gap-3 max-md:grid max-md:w-full max-md:grid-cols-3">
            {([["all", "Все"], ["body", "Кузов"], ["salon", "Салон"]] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`min-w-20 rounded-md px-5 py-1.5 text-sm font-semibold ${filter === k ? "btn-lime" : "border border-foreground bg-background"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="md:hidden">
          <MobileCareList phase={phase} setPhase={setPhase} added={added} toggle={toggle} show={show} />
        </div>
        <div className="mt-16 grid gap-x-4 gap-y-8 max-md:hidden md:grid-cols-3">
          {show("body") && (
            <div className="flex flex-col">
              <div className="relative">
                <img src={imgFoam.url} alt="Ручная мойка кузова в пене" width={720} height={405} loading="lazy" decoding="async" className="aspect-[3/2] w-full rounded-xl object-cover" />
                {phase && (
                  <span className="btn-lime absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-display text-2xl uppercase">Способ мойки</h3>
              <p className="font-display text-xl">от {rub(phases[0]!.price)} ₽</p>
              <p className="text-sm">Дополнение к комплексу</p>
              <p className="mt-2 mb-3 flex h-5 items-center text-sm">Без добавочного времени</p>
              <div className="mt-auto grid grid-cols-2 gap-2">
                {phases.map((p) => {
                  const on = phase === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPhase(on ? null : p.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${on ? "btn-lime" : "border border-foreground bg-background"}`}
                    >
                      {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {p.label} · {rub(p.price)} ₽
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {care.filter((c) => show(c.cat)).map((c) => {
            const on = added.includes(c.id);
            return (
              <div key={c.id} className="flex flex-col">
                <div className="relative">
                  <img src={c.img.url} alt={c.alt} width={720} height={480} loading="lazy" decoding="async" className="aspect-[3/2] w-full rounded-xl object-cover" />
                  {on && (
                    <span className="btn-lime absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-2xl uppercase">{c.name}</h3>
                <p className="font-display text-xl">от {rub(c.price)} ₽{c.extra > 0 && <span> +{c.extra} минут</span>}</p>
                <p className="text-sm">{c.desc}</p>
                <p className={`mt-2 mb-3 flex h-5 items-center text-sm ${c.extra === 0 ? "" : "invisible"}`} aria-hidden={c.extra !== 0}>
                  Без добавочного времени
                </p>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`mt-auto flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${on ? "btn-lime" : "border border-foreground bg-background"}`}
                >
                  {on ? <><Check className="h-4 w-4" /> Добавлено</> : <><Plus className="h-4 w-4" /> Добавить</>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-xl bg-muted px-6 py-5 max-md:mt-6 max-md:gap-3 max-md:px-4 md:flex-row md:items-center">
          <h3 className="font-display text-3xl uppercase md:border-r md:border-border md:pr-6">Ваша мойка</h3>
          <p className="flex-1 text-sm max-md:text-base">{summary}</p>
          <div className="max-md:flex max-md:items-center max-md:gap-4 md:border-l md:border-border md:pl-6">
            <p className="font-display text-3xl">от {rub(total)} ₽</p>
            <p className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> {tMin === tMax ? tMin : `${tMin}–${tMax}`} минут</p>
          </div>
          <button type="button" onClick={() => setBooking(true)} className="btn-lime inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm max-md:py-3.5 max-md:text-xl">
            Записаться <ArrowRight className="h-4 w-4" />
          </button>
          <BookingModal
            open={booking}
            onOpenChange={setBooking}
            pkgName={pkg.name}
            extras={[...(ph ? [ph.label] : []), ...chosen.map((c) => c.name)]}
            extraPrices={[...(ph ? [ph.price] : []), ...chosen.map((c) => c.price)]}
            basePrice={total}
            time={[tMin, tMax]}
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
          <p>Точная стоимость после выбора автомобиля. Затем — дата и время.</p>
          <a href="#" className="inline-flex items-center gap-1 underline underline-offset-4">Все дополнительные услуги</a>
        </div>
      </section>
    </>
  );
}

function HeaderBooking({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [stage, setStage] = useState<"pkg" | "care" | "rest">("pkg");
  const [selected, setSelected] = useState<number | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [phase, setPhase] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Cat>("all");

  const reset = () => { setStage("pkg"); setSelected(null); setAdded([]); setPhase(null); };
  const close = () => { onOpenChange(false); setTimeout(reset, 300); };

  const pkg = packages[selected ?? 0] ?? packages[0]!;
  const chosen = care.filter((c) => added.includes(c.id));
  const ph = phases.find((p) => p.id === phase);
  const total = pkg.price + chosen.reduce((a, c) => a + c.price, 0) + (ph?.price ?? 0);
  const extra = chosen.reduce((a, c) => a + c.extra, 0);
  const [tMin, tMax] = [pkg.time[0] + extra, pkg.time[1] + extra];
  const toggle = (id: string) => setAdded((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  if (stage === "rest") {
    return (
      <BookingModal
        open={open}
        onOpenChange={(o) => (o ? onOpenChange(o) : close())}
        onBack={() => setStage("care")}
        pkgName={pkg.name}
        extras={[...(ph ? [ph.label] : []), ...chosen.map((c) => c.name)]}
        extraPrices={[...(ph ? [ph.price] : []), ...chosen.map((c) => c.price)]}
        basePrice={total}
        time={[tMin, tMax]}
      />
    );
  }

  const steps = ["Комплекс", "Уход", "Автомобиль и время", "Контакты"];
  const cur = stage === "pkg" ? 0 : 1;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className={`max-h-[95vh] max-w-4xl overflow-y-auto rounded-3xl p-8 sm:p-10 [&>button:last-child]:hidden ${MOBILE_SHEET}`}>
        <button type="button" onClick={close} aria-label="Закрыть" className="absolute right-6 top-6 max-md:hidden">
          <X className="h-7 w-7" />
        </button>
        <MobileBookingBar label={steps[cur]!} step={cur + 1} onBack={() => (cur === 1 ? setStage("pkg") : close())} onClose={close} />
        <div className="flex items-center gap-4 max-md:hidden">
          <img src="/apple-touch-icon.png" alt="" width={64} height={64} className="h-16 w-16" />
          <DialogTitle className="font-display text-4xl uppercase sm:text-5xl">Запись на мойку</DialogTitle>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-6 text-lg max-md:hidden">
          {steps.map((s, i) => (
            <span key={s} className="flex items-center gap-6">
              {i > 0 && <ChevronRight className="mb-2 h-5 w-5" />}
              <button
                type="button"
                disabled={i !== 0 || cur === 0}
                onClick={() => setStage("pkg")}
                className={`flex items-center gap-2 pb-2 ${i === cur ? "border-b-4 border-lime font-semibold" : "text-muted-foreground"}`}
              >
                {i < cur && <Check className="h-5 w-5 text-lime" strokeWidth={3} />}
                {s}
              </button>
            </span>
          ))}
        </div>

        {stage === "pkg" ? (
          <>
            <h2 className="font-display text-3xl uppercase sm:text-5xl md:mt-4">Выберите комплекс</h2>
            <div className="mt-2 grid gap-4 md:grid-cols-3">
              {packages.map((p, i) => (
                <div key={p.name} className="grid grid-cols-2 gap-x-4 rounded-xl border border-border p-4 shadow-sm md:flex md:flex-col md:p-5">
                  <div>
                    <h3 className="font-display text-3xl uppercase">{p.name}</h3>
                    <p className="font-display text-3xl max-md:text-2xl">от {rub(p.price)} ₽</p>
                    <p className="mt-2 flex items-center gap-2"><Clock className="h-5 w-5" /> {p.time[0] === p.time[1] ? p.time[0] : `${p.time[0]}–${p.time[1]}`} мин<span className="max-md:hidden">ут</span></p>
                  </div>
                  <ul className="mt-3 space-y-1.5 max-md:mt-1 max-md:text-sm md:mb-5">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-center gap-2"><Check className="h-4 w-4" strokeWidth={3} /> {it === "Кузов пеной" ? "Мойка кузова пеной" : it}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => { setSelected(i); setStage("care"); }}
                    className="col-span-2 mt-4 flex items-center justify-center gap-2 rounded-lg border border-foreground py-2.5 font-semibold md:mt-auto"
                  >
                    Выбрать <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 text-sm">
              <p className="max-md:hidden">Сушка включена во время комплекса.</p>
              <p>Точная стоимость — после выбора автомобиля.</p>
              <p className="mt-2 text-muted-foreground max-md:hidden">Далее можно добавить уход или перейти к выбору автомобиля.</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:mt-4 md:flex-row md:items-baseline md:justify-between md:gap-4">
              <h2 className="font-display text-3xl uppercase sm:text-5xl">Добавьте уход</h2>
              <p className="flex items-center justify-between gap-4 text-sm max-md:rounded-lg max-md:bg-muted max-md:px-3 max-md:py-2">
                <span>Комплекс: <b>{pkg.name}</b></span>
                <button type="button" onClick={() => setStage("pkg")} className="underline underline-offset-4 md:hidden">Изменить</button>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:hidden">
              {([["all", "Все"], ["body", "Кузов"], ["salon", "Салон"]] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-md py-1.5 text-sm font-semibold ${filter === k ? "btn-lime" : "border border-foreground"}`}>{l}</button>
              ))}
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 max-md:mt-0">
              <div className={`rounded-xl border border-border p-4 ${filter === "salon" ? "max-md:hidden" : ""}`}>
                <p className="font-semibold">Способ мойки</p>
                <p className="text-sm text-muted-foreground">Без добавочного времени</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {phases.map((p) => {
                    const on = phase === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setPhase(on ? null : p.id)} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${on ? "btn-lime" : "border border-foreground"}`}>
                        {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {p.label} · {rub(p.price)} ₽
                      </button>
                    );
                  })}
                </div>
              </div>
              {care.map((c) => {
                const on = added.includes(c.id);
                return (
                  <div key={c.id} className={`flex items-center gap-4 rounded-xl border border-border p-4 max-md:gap-3 max-md:p-3 ${filter !== "all" && filter !== c.cat ? "max-md:hidden" : ""}`}>
                    <img src={c.img.url} alt={c.alt} width={96} height={64} loading="lazy" className="h-16 w-24 object-contain" />
                    <div className="flex-1">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm">от {rub(c.price)} ₽{c.extra > 0 ? ` +${c.extra} минут` : ""}</p>
                    </div>
                    <button type="button" onClick={() => toggle(c.id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${on ? "btn-lime" : "border border-foreground"}`}>
                      {on ? <Check className="h-5 w-5 md:h-4 md:w-4" strokeWidth={3} /> : <Plus className="h-5 w-5 md:h-4 md:w-4" />} <span className="max-md:hidden">{on ? "Добавлено" : "Добавить"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between max-md:sticky max-md:-bottom-5 max-md:-mx-5 max-md:gap-3 max-md:bg-background max-md:px-5 max-md:pb-5 max-md:pt-4">
              <div>
                <div className="flex items-center gap-6 max-md:gap-4">
                  <p className="font-display text-4xl max-md:text-3xl"><span className="md:hidden">от </span>{rub(total)} ₽</p>
                  <span className="h-10 border-l border-foreground/30" />
                  <span className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5" /> {tMin === tMax ? tMin : `${tMin}–${tMax}`} минут</span>
                </div>
                <button type="button" onClick={() => setStage("pkg")} className="mt-3 flex items-center gap-2 max-md:hidden">
                  <ArrowLeft className="h-5 w-5" /> <span className="underline underline-offset-4">Назад</span>
                </button>
              </div>
              <div className="text-center sm:w-[22rem]">
                <button type="button" onClick={() => setStage("rest")} className="btn-lime flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-lg font-semibold">
                  {chosen.length || ph ? "Продолжить" : "Без ухода, продолжить"} <ArrowRight className="h-5 w-5" />
                </button>
                <p className="mt-2 text-sm text-muted-foreground max-md:hidden">Далее — автомобиль и время</p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MobileCareList({ phase, setPhase, added, toggle, show }: { phase: string | null; setPhase: (p: string | null) => void; added: string[]; toggle: (id: string) => void; show: (c: Cat) => boolean }) {
  const [phaseOpen, setPhaseOpen] = useState(false);
  const iconBtn = (on: boolean) => `flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${on ? "btn-lime" : "border border-foreground bg-background"}`;
  return (
    <div className="mt-4">
      {show("body") && (
        <div className="border-b border-border py-3">
          <div className="flex items-center gap-3">
            <img src={imgFoam.url} alt="Ручная мойка кузова в пене" width={720} height={405} loading="lazy" decoding="async" className="aspect-[3/2] w-1/3 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl leading-tight">Способ мойки</h3>
              <p className="text-sm">2 фазы · <b>от 500 ₽</b></p>
              <p className="text-sm">3 фазы · <b>от 800 ₽</b></p>
            </div>
            <button type="button" onClick={() => setPhaseOpen((o) => !o)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${phase ? "btn-lime" : "border border-foreground bg-background"}`}>
              {phase ? <Check className="h-5 w-5" strokeWidth={3} /> : "Выбрать"}
            </button>
          </div>
          {(phaseOpen || phase) && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {phases.map((p) => {
                const on = phase === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setPhase(on ? null : p.id)} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${on ? "btn-lime" : "border border-foreground bg-background"}`}>
                    {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {p.label} · {rub(p.price)} ₽
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {care.filter((c) => show(c.cat)).map((c) => {
        const on = added.includes(c.id);
        return (
          <div key={c.id} className="flex items-center gap-3 border-b border-border py-3">
            <img src={c.img.url} alt={c.alt} width={720} height={480} loading="lazy" decoding="async" className="aspect-[3/2] w-1/3 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl leading-tight">{c.name}</h3>
              <p className="text-sm"><b className="font-display text-base">от {rub(c.price)} ₽</b>{c.extra > 0 && ` +${c.extra} мин`}</p>
              {c.extra === 0 && <p className="text-xs">Без доп. времени</p>}
            </div>
            <button type="button" onClick={() => toggle(c.id)} aria-label={on ? `Убрать: ${c.name}` : `Добавить: ${c.name}`} className={iconBtn(on)}>
              {on ? <Check className="h-6 w-6" strokeWidth={3} /> : <Plus className="h-6 w-6" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
