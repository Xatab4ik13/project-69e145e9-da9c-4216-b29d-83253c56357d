import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getLegalDoc, LEGAL_DOCS, OPERATOR } from "@/lib/legal/docs";

export const Route = createFileRoute("/docs/$slug")({
  loader: ({ params }) => {
    const doc = getLegalDoc(params.slug);
    if (!doc) throw notFound();
    return doc;
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.title} — автомойка Aquarius` : "Документы — автомойка Aquarius";
    const d = loaderData?.description ?? "Документы автомойки Aquarius.";
    return { meta: [
      { title: t }, { name: "description", content: d },
      { property: "og:title", content: t }, { property: "og:description", content: d },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: () => <div className="p-10 text-center">Документ не найден. <Link to="/" className="underline">На главную</Link></div>,
  component: DocPage,
});

function DocPage() {
  const doc = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 max-md:px-4">
      <Link to="/" className="text-sm font-semibold underline underline-offset-4">← На главную</Link>
      <h1 className="mt-6 font-display text-3xl uppercase max-md:text-2xl">{doc.title}</h1>
      {doc.sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="font-display text-xl uppercase">{s.title}</h2>
          <ul className="mt-3 space-y-2 leading-relaxed">
            {s.items.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </section>
      ))}
      <nav className="mt-12 border-t border-border pt-6">
        <h2 className="font-display text-lg uppercase">Другие документы</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {LEGAL_DOCS.filter((d) => d.slug !== doc.slug).map((d) => (
            <li key={d.slug}><Link to="/docs/$slug" params={{ slug: d.slug }} className="underline underline-offset-4">{d.short}</Link></li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">{OPERATOR.name}, ИНН {OPERATOR.inn}</p>
      </nav>
    </main>
  );
}
