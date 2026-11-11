import { CRM_PWA_LINKS, CRM_PWA_META } from "@/lib/crm/pwa-head";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminEntry } from "@/components/crm/AdminEntry";
import { getAppHost } from "@/lib/crm/host.functions";

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const host = await getAppHost();
    if (host === "crm") throw redirect({ to: "/" });
    if (host === "site") throw redirect({ href: "https://crm.aquariuswash.ru/" });
  },
  head: () => ({
    meta: [
      { title: "Расписание — CRM Aquarius" },
      { name: "description", content: "Расписание записей автомойки Aquarius для администратора." },
      { property: "og:title", content: "Расписание — CRM Aquarius" },
      { property: "og:description", content: "Расписание записей автомойки Aquarius для администратора." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
      ...CRM_PWA_META,
    ],
    links: CRM_PWA_LINKS,
  }),
  component: AdminEntry,
});
