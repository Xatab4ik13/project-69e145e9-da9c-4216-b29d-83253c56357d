import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Check, Clock, MapPin } from "lucide-react";
import logo from "@/assets/aquarius-logo.webp.asset.json";
import hero from "@/assets/car-wash-hero.webp.asset.json";

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
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 border-b border-border px-6 py-3">
        <a href="/" aria-label="Aquarius — автомойка">
          <img src={logo.url} alt="Логотип автомойки Aquarius" width={160} height={62} className="h-12 w-auto" />
        </a>
        <nav className="hidden items-center gap-10 text-sm font-medium md:flex">
          {nav.map((n) => (
            <a key={n} href="#" className="transition-colors hover:text-muted-foreground">
              {n}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <a href="#" className="btn-lime rounded-lg px-5 py-2.5 text-sm">
            Записаться
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 border-b border-border px-6 py-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="font-display text-5xl uppercase leading-[0.95] md:text-6xl">
            Автомойка
            <br />
            <span className="whitespace-nowrap">на Большевиков</span>
          </h1>
          <p className="mt-4 text-base leading-snug">
            Выберите мойку и нужный уход.
            <br />
            Стоимость и время — до записи.
          </p>
          <a href="#" className="btn-lime mt-6 inline-flex items-center gap-3 rounded-lg px-7 py-3 text-base">
            Выбрать мойку <ArrowUpRight className="h-4 w-4" />
          </a>
          <p className="mt-6 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" /> Большевиков, 18к2 · Ежедневно <b>10:00–22:00</b>
          </p>
        </div>
        <img
          src={hero.url}
          alt="Универсал в пене под струёй воды из мойки высокого давления"
          width={1400}
          height={667}
          fetchPriority="high"
          decoding="async"
          className="h-auto w-full"
        />
      </section>

      <Packages />
    </div>
  );
}

const packages = [
  { name: "Стандарт", price: "1 200", time: "40–60 минут", items: ["Кузов пеной", "Сушка", "Мойка ковров"] },
  { name: "Комфорт", price: "1 600", time: "50–60 минут", items: ["Всё из «Стандарта»", "Пылесос салона"] },
  { name: "Люкс", price: "1 900", time: "80 минут", items: ["Всё из «Комфорта»", "Очистка стёкол", "Очистка пластика"] },
];

function Packages() {
  const [selected, setSelected] = useState(1);
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="font-display text-4xl uppercase md:text-5xl">Выберите комплекс</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {packages.map((p, i) => {
          const active = i === selected;
          return (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-xl p-6 ${active ? "bg-muted" : ""} ${i > 0 && !active && selected !== i - 1 ? "md:border-l md:border-border" : ""}`}
            >
              {active && (
                <span className="btn-lime absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <h3 className="font-display text-3xl uppercase">{p.name}</h3>
              <p className="mt-1 text-2xl font-bold">от {p.price} ₽</p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" /> {p.time}
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-sm">
                {p.items.map((it) => (
                  <li key={it} className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> {it}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSelected(i)}
                className={`mt-5 rounded-lg py-2.5 text-sm font-medium ${active ? "btn-lime" : "border border-foreground bg-background"}`}
              >
                {active ? "Выбрано" : "Выбрать"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs">Сушка включена во время комплекса.</p>
    </section>
  );
}
