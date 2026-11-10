import { memo, useCallback, useMemo, useState } from "react";
import {
  CalendarPlus, CarFront, ChevronLeft, ChevronRight, Coins, History, Phone, Repeat2,
  Search, Smartphone, UserRoundPlus, Users, WalletCards,
} from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CrmPagination } from "@/components/crm/CrmPagination";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { fmtDateShort, fmtPhone, rub } from "@/lib/crm/logic";
import { DEMO_TODAY, MOCK_BOOKINGS } from "@/lib/crm/mock";
import { MOCK_LOYALTY_CLIENTS } from "@/lib/crm/loyalty-mock";
import { MOCK_CLIENT_CARS, MOCK_CLIENT_FIRST_CONTACT } from "@/lib/crm/clients-mock";
import {
  buildClients, carClassRoman, clientMetrics, filterClients, paginateClients,
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
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clients = useMemo(
    () => buildClients(MOCK_LOYALTY_CLIENTS, MOCK_BOOKINGS, MOCK_CLIENT_CARS, DEMO_TODAY, MOCK_CLIENT_FIRST_CONTACT),
    [],
  );
  const metrics = useMemo(() => clientMetrics(clients, DEMO_TODAY), [clients]);
  const visible = useMemo(() => filterClients(clients, query, filter, DEMO_TODAY), [clients, filter, query]);
  const pagination = useMemo(() => paginateClients(visible, page), [page, visible]);
  const openClient = useCallback((id: string) => setSelectedId(id), []);
  const selected = clients.find((client) => client.id === selectedId) ?? null;

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 pb-5 pt-4 md:bg-background md:px-6 md:pb-5 md:pt-5">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Клиенты</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Телефоны, автомобили и история посещений</p>
        </div>
        <span className="ml-auto hidden rounded-lg bg-crm-soft px-3 py-2 text-crm md:inline">Один клиент — один номер телефона</span>
        <div className="hidden md:block"><AdminNotificationIndicator /></div>
      </div>

      <section aria-label="Показатели клиентов" className="mt-4 grid grid-cols-2 gap-2 md:mt-5 md:grid-cols-4 md:gap-3">
        <Metric Icon={Users} label="Всего клиентов" value={clients.length} />
        <Metric Icon={UserRoundPlus} label="Новых в ноябре" value={metrics.newThisMonth} />
        <Metric Icon={Repeat2} label="Постоянных" value={metrics.repeat} note="2 и более визитов" />
        <Metric Icon={Smartphone} label="В приложении" value={metrics.activated} />
      </section>

      <section className="mt-4 flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card md:mt-5 md:min-h-[520px]">
        <div className="flex flex-col gap-3 border-b border-border p-3 md:flex-row md:items-center">
          <label className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 md:min-h-0 md:w-80 md:rounded-lg md:px-3 md:py-2">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground md:h-4 md:w-4" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Телефон или автомобиль"
              aria-label="Поиск клиента по телефону или автомобилю"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
          </label>
          <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1 md:ml-auto md:w-auto md:gap-0 md:overflow-visible md:p-0.5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setFilter(item.id); setPage(1); }}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-md px-4 py-2.5 text-sm md:min-h-0 md:px-3 md:py-1.5 ${filter === item.id ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 md:overflow-auto">
          <div className="divide-y divide-border md:hidden">
            {pagination.items.map((client) => <ClientMobileCard key={client.id} client={client} onSelect={openClient} />)}
          </div>
          <table className="hidden w-full min-w-[980px] text-left text-sm md:table">
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
              {pagination.items.map((client) => <ClientTableRow key={client.id} client={client} onSelect={openClient} />)}
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
        <div className="flex min-h-14 flex-col items-center justify-between gap-3 border-t border-border px-3 py-3 [&_button]:h-11 [&_button]:min-w-11 sm:flex-row sm:[&_button]:h-8 sm:[&_button]:min-w-8 md:px-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {visible.length > 0
              ? `Показано ${pagination.start}–${pagination.end} из ${visible.length}`
              : "Клиентов не найдено"}
          </p>
          <CrmPagination
            currentPage={pagination.currentPage}
            pageCount={pagination.pageCount}
            onPageChange={setPage}
            label="Страницы клиентов"
          />
        </div>
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        {selected && (
          <DialogContent
            className="left-0 top-0 flex h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 text-base sm:left-[50%] sm:top-[50%] sm:grid sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:gap-4 sm:overflow-y-auto sm:rounded-lg sm:text-sm"
            closeClassName="hidden sm:absolute sm:right-4 sm:top-4 sm:flex sm:h-8 sm:w-8 sm:border-0 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-4 sm:[&_svg]:w-4"
          >
            <DialogHeader className="relative flex shrink-0 flex-row items-center justify-center border-b border-border bg-background px-14 py-3 sm:hidden">
              <DialogClose aria-label="Вернуться к списку клиентов" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg active:bg-muted">
                <ChevronLeft className="h-6 w-6" />
              </DialogClose>
              <DialogTitle className="text-lg">Клиент</DialogTitle>
            </DialogHeader>
            <DialogHeader className="hidden border-b border-border bg-background px-5 py-5 pr-16 text-left sm:flex sm:px-6 sm:pr-12">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <DialogTitle className="text-xl leading-tight text-crm sm:text-2xl">{fmtPhone(selected.phone)}</DialogTitle>
                <AccountStatus activated={selected.activated} />
              </div>
              <DialogDescription>Первое обращение: {fmtDateShort(selected.firstContact)}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-0 sm:flex-none sm:overflow-visible sm:px-6">
              <div className="-mx-4 mb-4 border-b border-border bg-crm-surface px-5 py-4 sm:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-semibold text-crm">{fmtPhone(selected.phone)}</p>
                  <AccountStatus activated={selected.activated} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Первое обращение: {fmtDateShort(selected.firstContact)}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Summary label="Визитов" value={String(selected.visits)} />
                <Summary label="Оплачено" value={rub(selected.totalSpent)} />
                <Summary label="Бонусы" value={formatBonuses(selected.bonusBalance)} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onNewBooking(selected)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-crm px-3 py-3 text-base font-semibold text-crm-foreground sm:min-h-0 sm:rounded-lg sm:py-2.5 sm:text-sm">
                  <CalendarPlus className="h-5 w-5 sm:h-4 sm:w-4" /> Новая запись
                </button>
                <a href={`tel:+7${selected.phone}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-base font-semibold sm:min-h-0 sm:rounded-lg sm:py-2.5 sm:text-sm">
                  <Phone className="h-5 w-5 sm:h-4 sm:w-4" /> Позвонить
                </a>
              </div>
              <button type="button" onClick={() => onOpenLoyalty(selected.id)} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-base font-medium text-crm sm:min-h-0 sm:rounded-lg sm:py-2.5 sm:text-sm">
                <WalletCards className="h-4 w-4" /> Открыть бонусы
              </button>

              <section className="mt-6">
                <h2 className="flex items-center gap-2 font-semibold"><CarFront className="h-4 w-4 text-crm" /> Автомобили</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

const ClientMobileCard = memo(function ClientMobileCard({ client, onSelect }: { client: CrmClient; onSelect: (id: string) => void }) {
  const primaryCar = client.cars.find((car) => car.primary) ?? client.cars[0];
  return (
    <button
      type="button"
      onClick={() => onSelect(client.id)}
      aria-label={`Открыть клиента ${fmtPhone(client.phone)}`}
      className="block min-h-40 w-full p-4 text-left active:bg-crm-soft/45"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-crm">{fmtPhone(client.phone)}</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </span>
      <span className="mt-2 block text-base font-medium">{primaryCar?.name ?? "Автомобиль не указан"}</span>
      <span className="mt-0.5 block text-sm text-muted-foreground">
        {primaryCar ? `${carClassRoman(primaryCar.carClass)} класс` : ""}
        {client.cars.length > 1 ? ` · ещё ${client.cars.length - 1}` : ""}
      </span>
      <span className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <span><span className="text-muted-foreground">Визитов: </span><b>{client.visits}</b></span>
        <span className="text-right"><span className="text-muted-foreground">Оплачено: </span><b>{rub(client.totalSpent)}</b></span>
      </span>
      <span className="mt-3 flex items-center justify-between gap-3">
        <AccountStatus activated={client.activated} />
        <span className="text-sm font-semibold">{formatBonuses(client.bonusBalance)} бонусов</span>
      </span>
    </button>
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
    <article className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 md:gap-3 md:p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-crm-soft text-crm md:h-11 md:w-11"><Icon className="h-4 w-4 md:h-5 md:w-5" /></div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none md:text-2xl">{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">{label}</p>
        {note && <p className="mt-0.5 hidden text-xs text-muted-foreground md:block">{note}</p>}
      </div>
    </article>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/70 px-2 py-4 text-center sm:rounded-lg sm:px-3">
      <p className="text-lg font-bold sm:text-xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
