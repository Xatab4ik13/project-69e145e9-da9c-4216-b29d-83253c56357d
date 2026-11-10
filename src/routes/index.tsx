import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
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
    </div>
  );
}
