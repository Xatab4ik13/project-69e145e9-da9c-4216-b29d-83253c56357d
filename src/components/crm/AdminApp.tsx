import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { getApk, uploadApk, type ApkInfo } from "@/lib/crm/api";

const fmtSize = (b: number) => `${(b / 1024 / 1024).toFixed(1)} МБ`;
const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Temporary owner page: upload a new Android test build. */
export function AdminApp() {
  const [apk, setApk] = useState<ApkInfo>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { getApk().then((r) => setApk(r.apk)).catch(() => {}); }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const r = await uploadApk(file);
      setApk(r.apk);
      setMsg({ ok: true, text: "Готово — на сайте уже новая версия" });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Не удалось загрузить" });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-crm-surface px-4 py-4 pb-24 md:bg-background md:px-6 md:pb-6 md:pt-5">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Приложение</h1>
      <section className="mt-5 max-w-xl rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Android для тестов</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {apk ? `Сейчас на сайте: ${fmtSize(apk.size)}, загружен ${fmtDate(apk.updatedAt)}` : "Файл ещё не загружен"}
        </p>
        <input ref={input} type="file" accept=".apk" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Upload className="size-4" />{busy ? "Загружаю…" : "Загрузить новый APK"}
        </button>
        {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-foreground" : "text-destructive"}`}>{msg.text}</p>}
      </section>
    </main>
  );
}
