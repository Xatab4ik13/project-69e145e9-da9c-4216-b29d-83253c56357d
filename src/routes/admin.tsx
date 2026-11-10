import { createFileRoute } from "@tanstack/react-router";
import { AdminSchedule } from "@/components/crm/AdminSchedule";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Расписание — CRM Aquarius" },
      { name: "description", content: "Расписание записей автомойки Aquarius для администратора." },
      { property: "og:title", content: "Расписание — CRM Aquarius" },
      { property: "og:description", content: "Расписание записей автомойки Aquarius для администратора." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSchedule,
});
