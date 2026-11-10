import { memo, useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, Clock3, Coins, Search, Smartphone, Star, Users, WalletCards } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CrmPagination } from "@/components/crm/CrmPagination";
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
    <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-5 pt-5">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Лояльность</h1>
          <p className="mt-1 text-muted-foreground">Бонусные счета клиентов и история операций</p>
        </div>
        <span className="ml-auto rounded-lg bg-crm-soft px-3 py-2 text-crm">1 бонус = 1 ₽</span>
      </div>

      <section aria-label="Правила программы" className="mt-5 grid grid-cols-4 overflow-hidden rounded-xl border border-crm/20 bg-crm-soft">
        {RULES.map((rule) => (
          <div key={rule.value} className="border-r border-crm/15 px-4 py-3 last:border-r-0">
            <div className="flex items-baseline gap-2 text-crm">
              <span className="text-2xl font-bold tracking-tight">{rule.value}</span>
              <span className="font-medium">{rule.text}</span>
            </div>
            <p className="mt-1 text-xs text-crm/75">{rule.note}</p>
          </div>
        ))}
      </section>

      <section aria-label="Показатели лояльности" className="mt-4 grid grid-cols-4 gap-3">
        <Metric Icon={Users} label="Клиентов" value={formatBonuses(metrics.clients)} />
        <Metric Icon={Smartphone} label="Кабинетов активно" value={formatBonuses(metrics.activated)} />
        <Metric Icon={WalletCards} label="Бонусов на балансах" value={formatBonuses(metrics.balance)} />
        <Metric Icon={Coins} label="Списано в ноябре" value={formatBonuses(metrics.redeemedThisMonth)} />
      </section>

      <section className="mt-5 flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-3 border-b border-border p-3">
          <label className="flex w-72 items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Номер телефона"
              aria-label="Поиск клиента по номеру телефона"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="ml-auto flex rounded-lg bg-muted p-0.5">
            {([
              ["all", "Все"], ["active", "В приложении"], ["inactive", "Не активирован"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setFilter(value); setPage(1); }}
                className={`rounded-md px-3 py-1.5 font-medium ${filter === value ? "bg-background text-crm shadow-sm" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
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
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        {selected && <ClientDetails client={selected} />}
      </Dialog>
    </main>
  );
}

function Metric({ Icon, label, value }: { Icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-crm-soft text-crm"><Icon className="h-4 w-4" /></span>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p></div>
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

function AccountStatus({ activated }: { activated: boolean }) {
  return activated
    ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-crm-ok px-2.5 py-1 text-xs font-medium text-crm-ok-foreground"><Check className="h-3.5 w-3.5" /> В приложении</span>
    : <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-crm-warn px-2.5 py-1 text-xs font-medium text-crm-warn-foreground"><Clock3 className="h-3.5 w-3.5" /> Не активирован</span>;
}

function ClientDetails({ client }: { client: LoyaltyClient }) {
  const balance = loyaltyBalance(client, DEMO_TODAY);
  const transactions = [...client.transactions].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto p-0">
      <DialogHeader className="border-b border-border px-6 py-5 pr-12">
        <DialogDescription>Бонусный счёт клиента</DialogDescription>
        <div className="flex items-center gap-3">
          <DialogTitle className="text-2xl">{fmtPhone(client.phone)}</DialogTitle>
          <AccountStatus activated={client.activated} />
        </div>
      </DialogHeader>
      <div className="px-6 pb-6">
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
