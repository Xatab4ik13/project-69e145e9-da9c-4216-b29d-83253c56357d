import { memo, useCallback, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, Coins, Search, Smartphone, Star, Users, WalletCards } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CrmPagination } from "@/components/crm/CrmPagination";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { paginateClients } from "@/lib/crm/clients";
import { fmtPhone, fmtDateShort, phoneDigits, rub } from "@/lib/crm/logic";
import { DEMO_TODAY } from "@/lib/crm/mock";
import { MOCK_LOYALTY_CLIENTS } from "@/lib/crm/loyalty-mock";
import { formatBonuses, loyaltyBalance, loyaltyMetrics } from "@/lib/crm/loyalty";
import type { LoyaltyClient } from "@/lib/crm/loyalty";

const RULES = [
  { value: "5%", text: "с денежной части чека", note: "Начисление после оплаты" },
  { value: "200", text: "приветственных бонусов", note: "После первого входа по SMS" },
  { value: "до 20%", text: "всего чека бонусами", note: "Сумму выбирает клиент" },
  { value: "12 мес.", text: "срок каждого начисления", note: "Затем бонусы сгорают" },
];

export function AdminLoyalty({ initialClientId }: { initialClientId?: string | null }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(initialClientId ?? null);
  const metrics = useMemo(() => loyaltyMetrics(MOCK_LOYALTY_CLIENTS, DEMO_TODAY), []);

  const clients = useMemo(() => MOCK_LOYALTY_CLIENTS.filter((client) => {
    const digits = phoneDigits(query);
    const matchesQuery = !query.trim() || (digits.length > 0 && client.phone.includes(digits));
    const matchesFilter = filter === "all" || (filter === "active" ? client.activated : !client.activated);
    return matchesQuery && matchesFilter;
  }), [filter, query]);
  const pagination = useMemo(() => paginateClients(clients, page), [clients, page]);

  const openClient = useCallback((id: string) => setSelectedId(id), []);
  const selected = MOCK_LOYALTY_CLIENTS.find((client) => client.id === selectedId) ?? null;

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 pb-5 pt-4 md:bg-background md:px-6 md:pb-5 md:pt-5">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Лояльность</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Бонусные счета клиентов и история операций</p>
        </div>
        <span className="ml-auto hidden rounded-lg bg-crm-soft px-3 py-2 text-crm md:inline">1 бонус = 1 ₽</span>
        <div className="hidden md:block"><AdminNotificationIndicator /></div>
      </div>

      <section aria-label="Правила программы" className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-crm/20 bg-crm/20 md:mt-5 md:grid-cols-4">
        {RULES.map((rule) => (
          <div key={rule.value} className="bg-crm-soft px-3 py-3 md:px-4">
            <div className="flex flex-col text-crm md:flex-row md:items-baseline md:gap-2">
              <span className="text-2xl font-bold tracking-tight">{rule.value}</span>
              <span className="mt-0.5 text-sm font-medium md:mt-0 md:text-base">{rule.text}</span>
            </div>
            <p className="mt-1 text-xs text-crm/75">{rule.note}</p>
          </div>
        ))}
      </section>

      <section aria-label="Показатели лояльности" className="mt-3 grid grid-cols-2 gap-2 md:mt-4 md:grid-cols-4 md:gap-3">
        <Metric Icon={Users} label="Клиентов" value={formatBonuses(metrics.clients)} />
        <Metric Icon={Smartphone} label="Кабинетов активно" value={formatBonuses(metrics.activated)} />
        <Metric Icon={WalletCards} label="Бонусов на балансах" value={formatBonuses(metrics.balance)} />
        <Metric Icon={Coins} label="Списано в ноябре" value={formatBonuses(metrics.redeemedThisMonth)} />
      </section>

      <section className="mt-4 flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card md:mt-5 md:min-h-[520px]">
        <div className="flex flex-col gap-3 border-b border-border p-3 md:flex-row md:items-center">
          <label className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 md:min-h-0 md:w-72 md:rounded-lg md:px-3 md:py-2">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground md:h-4 md:w-4" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Номер телефона"
              aria-label="Поиск клиента по номеру телефона"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
          </label>
          <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1 md:ml-auto md:flex md:w-auto md:gap-0 md:p-0.5">
            {([
              ["all", "Все"], ["active", "В приложении"], ["inactive", "Не активирован"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setFilter(value); setPage(1); }}
                className={`min-h-11 whitespace-nowrap rounded-md px-2 py-2.5 text-sm font-medium md:min-h-0 md:px-3 md:py-1.5 ${filter === value ? "bg-background text-crm shadow-sm" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 md:overflow-auto">
          <div className="divide-y divide-border md:hidden">
            {pagination.items.map((client) => <ClientMobileCard key={client.id} client={client} onSelect={openClient} />)}
          </div>
          <table className="hidden w-full min-w-[720px] border-collapse text-left md:table">
            <thead className="sticky top-0 z-10 bg-crm-surface text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-3 py-3 font-medium">Кабинет</th>
                <th className="px-3 py-3 text-right font-medium">Баланс</th>
                <th className="px-3 py-3 text-right font-medium">Визиты</th>
                <th className="px-3 py-3 text-right font-medium">Оплачено</th>
                <th className="px-3 py-3 font-medium">Последний визит</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((client) => (
                <ClientRow key={client.id} client={client} onSelect={openClient} />
              ))}
            </tbody>
          </table>
          {clients.length === 0 && <p className="px-4 py-10 text-center text-muted-foreground">Клиенты с таким номером не найдены.</p>}
        </div>
        <div className="flex min-h-14 flex-col items-center justify-between gap-3 border-t border-border px-3 py-3 [&_button]:h-11 [&_button]:min-w-11 sm:flex-row sm:[&_button]:h-8 sm:[&_button]:min-w-8 md:px-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {clients.length > 0
              ? `Показано ${pagination.start}–${pagination.end} из ${clients.length}`
              : "Клиентов не найдено"}
          </p>
          <CrmPagination
            currentPage={pagination.currentPage}
            pageCount={pagination.pageCount}
            onPageChange={setPage}
            label="Страницы лояльности"
          />
        </div>
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        {selected && <ClientDetails client={selected} />}
      </Dialog>
    </main>
  );
}

function Metric({ Icon, label, value }: { Icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 md:gap-3 md:px-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-crm-soft text-crm"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-lg font-bold tabular-nums md:text-xl">{value}</p></div>
    </div>
  );
}

const ClientRow = memo(function ClientRow({ client, onSelect }: { client: LoyaltyClient; onSelect: (id: string) => void }) {
  const balance = loyaltyBalance(client, DEMO_TODAY);
  return (
    <tr
      tabIndex={0}
      onClick={() => onSelect(client.id)}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(client.id); }}
      className="cursor-pointer border-t border-border outline-none transition-colors hover:bg-crm-soft/45 focus:bg-crm-soft/45"
    >
      <td className="whitespace-nowrap px-4 py-4 font-semibold">{fmtPhone(client.phone)}</td>
      <td className="px-3 py-4"><AccountStatus activated={client.activated} /></td>
      <td className="whitespace-nowrap px-3 py-4 text-right font-bold tabular-nums">{formatBonuses(balance)}</td>
      <td className="px-3 py-4 text-right tabular-nums">{client.visits}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right tabular-nums">{rub(client.totalSpent)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">{client.lastVisit ? fmtDateShort(client.lastVisit) : "Ещё не было"}</td>
      <td className="pr-3 text-muted-foreground"><ChevronRight className="h-4 w-4" /></td>
    </tr>
  );
});

const ClientMobileCard = memo(function ClientMobileCard({ client, onSelect }: { client: LoyaltyClient; onSelect: (id: string) => void }) {
  const balance = loyaltyBalance(client, DEMO_TODAY);
  return (
    <button
      type="button"
      onClick={() => onSelect(client.id)}
      aria-label={`Открыть бонусы клиента ${fmtPhone(client.phone)}`}
      className="block min-h-44 w-full p-4 text-left active:bg-crm-soft/45"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-crm">{fmtPhone(client.phone)}</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </span>
      <span className="mt-2 block"><AccountStatus activated={client.activated} /></span>
      <span className="mt-3 flex items-end justify-between gap-3">
        <span>
          <span className="block text-xs text-muted-foreground">Доступно бонусов</span>
          <span className="mt-0.5 block text-2xl font-bold tabular-nums">{formatBonuses(balance)}</span>
        </span>
        <span className="text-right text-sm"><span className="text-muted-foreground">Визитов: </span><b>{client.visits}</b></span>
      </span>
      <span className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">{client.lastVisit ? fmtDateShort(client.lastVisit) : "Визитов ещё не было"}</span>
        <span className="font-semibold">{rub(client.totalSpent)}</span>
      </span>
    </button>
  );
});

function AccountStatus({ activated }: { activated: boolean }) {
  return activated
    ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-crm-ok px-2.5 py-1 text-xs font-medium text-crm-ok-foreground"><Check className="h-3.5 w-3.5" /> В приложении</span>
    : <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-crm-warn px-2.5 py-1 text-xs font-medium text-crm-warn-foreground"><Clock3 className="h-3.5 w-3.5" /> Не активирован</span>;
}

function ClientDetails({ client }: { client: LoyaltyClient }) {
  const balance = loyaltyBalance(client, DEMO_TODAY);
  const transactions = [...client.transactions].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <DialogContent
      className="left-0 top-0 flex h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 text-base sm:left-[50%] sm:top-[50%] sm:grid sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:gap-4 sm:overflow-y-auto sm:rounded-lg sm:text-sm"
      closeClassName="hidden sm:absolute sm:right-4 sm:top-4 sm:flex sm:h-8 sm:w-8 sm:border-0 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-4 sm:[&_svg]:w-4"
    >
      <DialogHeader className="relative flex shrink-0 flex-row items-center justify-center border-b border-border bg-background px-14 py-3 sm:hidden">
        <DialogClose aria-label="Вернуться к списку лояльности" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg active:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </DialogClose>
        <DialogTitle className="text-lg">Бонусы клиента</DialogTitle>
      </DialogHeader>
      <DialogHeader className="hidden border-b border-border px-6 py-5 pr-12 sm:flex">
        <DialogDescription>Бонусный счёт клиента</DialogDescription>
        <div className="flex items-center gap-3">
          <DialogTitle className="text-2xl">{fmtPhone(client.phone)}</DialogTitle>
          <AccountStatus activated={client.activated} />
        </div>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-0 sm:flex-none sm:overflow-visible sm:px-6">
        <div className="-mx-4 mb-4 border-b border-border bg-crm-surface px-5 py-4 sm:hidden">
          <p className="text-sm text-muted-foreground">Бонусный счёт клиента</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xl font-semibold text-crm">{fmtPhone(client.phone)}</p>
            <AccountStatus activated={client.activated} />
          </div>
        </div>
        <div className="rounded-xl bg-crm-soft p-5 text-crm">
          <p className="text-sm">Доступно бонусов</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{formatBonuses(balance)}</p>
        </div>
        {!client.activated && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Бонусы за мойки уже копятся. 200 приветственных будут добавлены после первого входа по SMS.
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-crm-surface p-4"><p className="text-sm text-muted-foreground">Визитов</p><p className="mt-1 text-xl font-semibold">{client.visits}</p></div>
          <div className="rounded-lg bg-crm-surface p-4"><p className="text-sm text-muted-foreground">Оплачено</p><p className="mt-1 text-xl font-semibold">{rub(client.totalSpent)}</p></div>
        </div>

        <section className="mt-6">
          <h3 className="flex items-center gap-2 font-semibold"><Star className="h-4 w-4 text-crm" /> История бонусов</h3>
          {transactions.length ? (
            <div className="mt-3 space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-medium">{transaction.description}</p><p className="mt-1 text-xs text-muted-foreground">{fmtDateShort(transaction.date)}</p></div>
                    <span className={`shrink-0 text-lg font-bold tabular-nums ${transaction.amount > 0 ? "text-crm-ok-foreground" : "text-foreground"}`}>
                      {transaction.amount > 0 ? "+" : "−"}{formatBonuses(Math.abs(transaction.amount))}
                    </span>
                  </div>
                  {transaction.expiresAt && <p className="mt-2 text-xs text-muted-foreground">Действуют до {fmtDateShort(transaction.expiresAt)}</p>}
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-muted-foreground">Операций пока не было. Бонусы появятся после первой оплаченной мойки.</p>}
        </section>
      </div>
    </DialogContent>
  );
}
