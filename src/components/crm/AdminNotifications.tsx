import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fmtDateShort } from "@/lib/crm/logic";
import { MOCK_LOYALTY_CLIENTS } from "@/lib/crm/loyalty-mock";
import {
  AUDIENCE_LABEL, AUTO_PUSHES, PUSH_LIMITS, audienceClients, pushError,
  type AutoPushId, type PushAudience, type SentPush,
} from "@/lib/crm/notifications";

export function AdminNotifications({ today }: { today: string }) {
  const [audience, setAudience] = useState<PushAudience>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState<SentPush[]>([]);
  const [auto, setAuto] = useState<Record<AutoPushId, boolean>>({ car_ready: true, booking_reminder: true, bonus_accrued: true });

  const counts = useMemo(() => ({
    all: audienceClients(MOCK_LOYALTY_CLIENTS, "all", today).length,
    expiring: audienceClients(MOCK_LOYALTY_CLIENTS, "expiring", today).length,
  }), [today]);
  const error = pushError(title, body);

  const send = () => {
    setSent((l) => [{ id: `p${Date.now()}`, date: today, audience, title: title.trim(), body: body.trim(), recipients: counts[audience] }, ...l]);
    setTitle(""); setBody(""); setTouched(false); setConfirm(false);
  };

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 pb-24 md:bg-background md:px-6 md:pb-6 md:pt-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Уведомления</h1>
        <div className="hidden md:block"><AdminNotificationIndicator /></div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Пуш-уведомления клиентам в мобильном приложении</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-background p-4">
          <h2 className="font-semibold">Новая рассылка</h2>
          <p className="mt-3 text-sm text-muted-foreground">Кому</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(Object.keys(AUDIENCE_LABEL) as PushAudience[]).map((id) => (
              <button key={id} type="button" aria-pressed={audience === id} onClick={() => setAudience(id)}
                className={`min-h-14 rounded-lg border px-4 py-2 text-left ${audience === id ? "border-crm bg-crm-soft text-crm" : "border-border"}`}>
                <span className="block font-medium">{AUDIENCE_LABEL[id]}</span>
                <span className="text-sm text-muted-foreground">{counts[id]} клиентов</span>
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm text-muted-foreground" htmlFor="push-title">Заголовок</label>
          <input id="push-title" value={title} maxLength={PUSH_LIMITS.title} onChange={(e) => setTitle(e.target.value)}
            className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-base" />
          <span className="mt-1 block text-right text-xs text-muted-foreground">{title.length}/{PUSH_LIMITS.title}</span>

          <label className="block text-sm text-muted-foreground" htmlFor="push-body">Текст</label>
          <textarea id="push-body" value={body} maxLength={PUSH_LIMITS.body} rows={4} onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-base" />
          <span className="mt-1 block text-right text-xs text-muted-foreground">{body.length}/{PUSH_LIMITS.body}</span>

          {(title || body) && (
            <div className="mt-2 rounded-xl bg-muted p-3">
              <span className="text-xs text-muted-foreground">Так увидит клиент · Aquarius</span>
              <p className="mt-1 font-semibold">{title || "Заголовок"}</p>
              <p className="text-sm">{body || "Текст уведомления"}</p>
            </div>
          )}
          {touched && error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          <button type="button" onClick={() => { setTouched(true); if (!error && counts[audience] > 0) setConfirm(true); }}
            disabled={counts[audience] === 0}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-crm px-4 font-semibold text-crm-foreground disabled:opacity-50 sm:w-auto">
            <Send className="h-5 w-5" /> Отправить сейчас
          </button>
        </section>

        <section className="rounded-xl border border-border bg-background p-4">
          <h2 className="font-semibold">Автоматические</h2>
          <p className="mt-1 text-sm text-muted-foreground">Отправляются сами по событию</p>
          {AUTO_PUSHES.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.text}</p>
              </div>
              <Switch aria-label={p.title} checked={auto[p.id]} onCheckedChange={(v) => setAuto((a) => ({ ...a, [p.id]: v }))} />
            </div>
          ))}
        </section>
      </div>

      <section className="mt-3 rounded-xl border border-border bg-background p-4">
        <h2 className="font-semibold">Отправленные</h2>
        {sent.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Пока ничего не отправляли</p> : sent.map((p) => (
          <article key={p.id} className="border-b border-border py-3 last:border-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{p.title}</p>
              <span className="text-xs text-muted-foreground">{fmtDateShort(p.date)} · {AUDIENCE_LABEL[p.audience]} · {p.recipients} клиентов</span>
            </div>
            <p className="text-sm text-muted-foreground">{p.body}</p>
          </article>
        ))}
      </section>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отправить уведомление?</AlertDialogTitle>
            <AlertDialogDescription>{AUDIENCE_LABEL[audience]} · {counts[audience]} клиентов. Отменить после отправки нельзя.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={send}>Отправить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
