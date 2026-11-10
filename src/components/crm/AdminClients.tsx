import { memo, useCallback, useMemo, useState } from "react";
import {
  CalendarPlus, CarFront, ChevronRight, Coins, History, Phone, Repeat2,
  Search, Smartphone, UserRoundPlus, Users, WalletCards,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDateShort, fmtPhone, rub } from "@/lib/crm/logic";
import { DEMO_TODAY, MOCK_BOOKINGS } from "@/lib/crm/mock";
import { MOCK_LOYALTY_CLIENTS } from "@/lib/crm/loyalty-mock";
import { MOCK_CLIENT_CARS, MOCK_CLIENT_FIRST_CONTACT } from "@/lib/crm/clients-mock";
import {
  buildClients, carClassRoman, clientMetrics, filterClients,
  type ClientFilter, type ClientVisitStatus, type CrmClient,
} from "@/lib/crm/clients";
import { formatBonuses } from "@/lib/crm/loyalty";

const FILTERS: { id: ClientFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "repeat", label: "Постоянные" },
  { id: "no_app", label: "Без приложения" },
  { id: "inactive", label: "Больше 30 дней" },
];

const VISIT_LABELS: Record<ClientVisitStatus, string> = {
  completed: "Завершена",
  upcoming: "Предстоящая",
  in_progress: "В работе",
  cancelled: "Отменена",
};

export function AdminClients({
  onNewBooking,
  onOpenLoyalty,
}: {
  onNewBooking: (client: CrmClient) => void;
  onOpenLoyalty: (clientId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clients = useMemo(
    () => buildClients(MOCK_LOYALTY_CLIENTS, MOCK_BOOKINGS, MOCK_CLIENT_CARS, DEMO_TODAY, MOCK_CLIENT_FIRST_CONTACT),
    [],
  );
  const metrics = useMemo(() => clientMetrics(clients, DEMO_TODAY), [clients]);
  const visible = useMemo(() => filterClients(clients, query, filter, DEMO_TODAY), [clients, filter, query]);
  const openClient = useCallback((id: string) => setSelectedId(id), []);
  const selected = clients.find((client) => client.id === selectedId) ?? null;

  return (
    <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-5 pt-5">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Клиенты</h1>
          <p className="mt-1 text-muted-foreground">Телефоны, автомобили и история посещений</p>
        </div>
        <span className="ml-auto rounded-lg bg-crm-soft px-3 py-2 text-crm">Один клиент — один номер телефона</span>
      </div>

      <section aria-label="Показатели клиентов" className="mt-5 grid grid-cols-4 gap-3">
        <Metric Icon={Users} label="Всего клиентов" value={clients.length} />
        <Metric Icon={UserRoundPlus} label="Новых в ноябре" value={metrics.newThisMonth} />
        <Metric Icon={Repeat2} label="Постоянных" value={metrics.repeat} note="2 и более визитов" />
        <Metric Icon={Smartphone} label="В приложении" value={metrics.activated} />
      </section>

      <section className="mt-5 flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-3 border-b border-border p-3">
          <label className="flex w-80 items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Телефон или автомобиль"
              aria-label="Поиск клиента по телефону или автомобилю"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="ml-auto flex rounded-lg bg-muted p-0.5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${filter === item.id ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card text-xs uppercase text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Автомобили</th>
                <th className="px-4 py-3 font-medium">Визиты</th>
                <th className="px-4 py-3 font-medium">Последний визит</th>
                <th className="px-4 py-3 font-medium">Всего оплачено</th>
                <th className="px-4 py-3 font-medium">Кабинет</th>
                <th className="px-4 py-3 font-medium">Бонусы</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {visible.map((client) => <ClientTableRow key={client.id} client={client} onSelect={openClient} />)}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Клиенты не найдены</p>
              <p className="mt-1 text-sm text-muted-foreground">Измените запрос или выберите другой фильтр.</p>
            </div>
          )}
        </div>
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        {selected && (
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto p-0">
            <DialogHeader className="border-b border-border px-6 py-5 pr-12">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl text-crm">{fmtPhone(selected.phone)}</DialogTitle>
                <AccountStatus activated={selected.activated} />
              </div>
              <DialogDescription>Первое обращение: {fmtDateShort(selected.firstContact)}</DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-3">
                <Summary label="Визитов" value={String(selected.visits)} />
                <Summary label="Оплачено" value={rub(selected.totalSpent)} />
                <Summary label="Бонусы" value={formatBonuses(selected.bonusBalance)} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onNewBooking(selected)} className="flex items-center justify-center gap-2 rounded-lg bg-crm px-3 py-2.5 text-sm font-semibold text-crm-foreground">
                  <CalendarPlus className="h-4 w-4" /> Новая запись
                </button>
                <a href={`tel:+7${selected.phone}`} className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold">
                  <Phone className="h-4 w-4" /> Позвонить
                </a>
              </div>
              <button type="button" onClick={() => onOpenLoyalty(selected.id)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-crm">
                <WalletCards className="h-4 w-4" /> Открыть бонусы
              </button>

              <section className="mt-6">
                <h2 className="flex items-center gap-2 font-semibold"><CarFront className="h-4 w-4 text-crm" /> Автомобили</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {selected.cars.map((car) => (
                    <div key={car.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{car.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{car.primary ? "Основной автомобиль" : "Дополнительный"}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-crm-soft px-2 py-1 text-xs font-semibold text-crm">{carClassRoman(car.carClass)} класс</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h2 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-crm" /> История посещений</h2>
                <div className="mt-3 space-y-3">
                  {selected.history.map((visit) => (
                    <article key={visit.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{fmtDateShort(visit.date)} · {visit.time}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{visit.car}</p>
                        </div>
                        <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${visit.status === "completed" ? "bg-crm-ok text-crm-ok-foreground" : visit.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-crm-soft text-crm"}`}>
                          {VISIT_LABELS[visit.status]}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium">Комплекс «{visit.packageName}»</p>
                      {visit.services.length > 0 && <p className="mt-1 text-xs leading-5 text-muted-foreground">{visit.services.join(" · ")}</p>}
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                        <span className="text-muted-foreground">{visit.paymentLabel}</span>
                        <span className="font-bold">{rub(visit.total)}</span>
                      </div>
                    </article>
                  ))}
                  {selected.history.length === 0 && <p className="text-sm text-muted-foreground">Записей пока нет.</p>}
                </div>
              </section>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}

const ClientTableRow = memo(function ClientTableRow({ client, onSelect }: { client: CrmClient; onSelect: (id: string) => void }) {
  const primaryCar = client.cars.find((car) => car.primary) ?? client.cars[0];
  return (
    <tr
      tabIndex={0}
      onClick={() => onSelect(client.id)}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(client.id); }}
      className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-crm-soft/45 focus:bg-crm-soft/45"
    >
      <td className="px-4 py-4 font-semibold text-crm">{fmtPhone(client.phone)}</td>
      <td className="px-4 py-4">
        <p className="font-medium">{primaryCar?.name ?? "Не указан"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {primaryCar ? `${carClassRoman(primaryCar.carClass)} класс` : ""}
          {client.cars.length > 1 ? ` · ещё ${client.cars.length - 1}` : ""}
        </p>
      </td>
      <td className="px-4 py-4 font-medium">{client.visits}</td>
      <td className="px-4 py-4">{client.lastVisit ? fmtDateShort(client.lastVisit) : "Ещё не был"}</td>
      <td className="px-4 py-4 font-medium">{rub(client.totalSpent)}</td>
      <td className="px-4 py-4"><AccountStatus activated={client.activated} /></td>
      <td className="px-4 py-4 font-semibold">{formatBonuses(client.bonusBalance)}</td>
      <td className="pr-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
    </tr>
  );
});

function AccountStatus({ activated }: { activated: boolean }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${activated ? "bg-crm-soft text-crm" : "bg-muted text-muted-foreground"}`}>
      {activated ? "В приложении" : "Не активирован"}
    </span>
  );
}

function Metric({ Icon, label, value, note }: { Icon: typeof Coins; label: string; value: number; note?: string }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-crm-soft text-crm"><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>
    </article>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/70 px-3 py-4 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
