import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import {
  CAR_CLASSES, DEFAULT_SERVICE_CATALOG, SERVICE_GROUPS, updateServiceCell,
} from "@/lib/crm/services";
import type { CarClass, CatalogService, ServiceCellField } from "@/lib/crm/services";
import { api } from "@/lib/crm/api";

const ROMAN_CLASS: Record<CarClass, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
const NUMBER_INPUT = "shrink-0 rounded-md border border-border bg-background px-2 py-1.5 text-right tabular-nums outline-none focus:border-crm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const MOBILE_NUMBER_INPUT = "mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-right text-base tabular-nums outline-none focus:border-crm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

type SaveStatus = "idle" | "dirty" | "saved" | "error";

export function AdminServices() {
  const [catalog, setCatalog] = useState<CatalogService[]>(DEFAULT_SERVICE_CATALOG);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    api.prices().then(setCatalog, (e: Error) => { setErrorText(e.message); setStatus("error"); });
  }, []);

  const edit = (serviceId: string, classId: CarClass, field: ServiceCellField, raw: string) => {
    const value = raw.trim() === "" ? null : Number(raw);
    setCatalog((current) => updateServiceCell(current, serviceId, classId, field, value === null || Number.isFinite(value) ? value : null));
    setStatus("dirty");
  };

  const save = () => {
    setConfirmOpen(false);
    api.savePrices(catalog).then(
      () => setStatus("saved"),
      (e: Error) => { setErrorText(e.message); setStatus("error"); },
    );
  };

  const statusText = {
    idle: "Цены и время можно изменить вручную.",
    dirty: "Есть несохранённые изменения.",
    saved: "Изменения сохранены.",
    error: errorText || "Не удалось сохранить. Попробуйте ещё раз.",
  }[status];

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-crm-surface px-4 pb-3 pt-4 md:bg-background md:px-6 md:pb-4 md:pt-5">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Услуги</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Редактируемый прайс по классам автомобилей</p>
        </div>
        <div className="ml-auto hidden md:block"><AdminNotificationIndicator /></div>
      </div>

      <div className="mt-4 shrink-0 rounded-xl border border-crm/20 bg-crm-soft px-3 py-3 text-sm text-crm md:px-4 md:text-base">
        Цены указаны в рублях, время — в минутах. На сайте показывается цена I класса с пометкой «от».
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card md:mt-5">
        <div className="md:hidden">
          {SERVICE_GROUPS.map((group) => (
            <section key={group} aria-label={group}>
              <h2 className="border-t border-border bg-crm-surface px-4 py-3 text-sm font-semibold text-crm first:border-t-0">{group}</h2>
              {catalog.filter((service) => service.group === group).map((service) => (
                <MobileServiceEditor key={service.id} service={service} onEdit={edit} />
              ))}
            </section>
          ))}
        </div>
        <table className="hidden w-full min-w-[1120px] table-fixed border-collapse text-left md:table">
          <thead className="sticky top-0 z-10 bg-crm-surface text-muted-foreground">
            <tr>
              <th className="w-64 px-4 py-3 font-medium">Услуга</th>
              {CAR_CLASSES.map((classId) => (
                <th key={classId} className="px-4 py-3 font-medium">
                  {ROMAN_CLASS[classId]} класс
                  <span className="block text-xs font-normal">цена · время</span>
                </th>
              ))}
            </tr>
          </thead>
          {SERVICE_GROUPS.map((group) => (
            <tbody key={group}>
              <tr className="border-t border-border bg-crm-surface">
                <th colSpan={5} className="px-4 py-2.5 text-left font-semibold text-crm">{group}</th>
              </tr>
              {catalog.filter((service) => service.group === group).map((service) => (
                <tr key={service.id} data-service-id={service.id} className="border-t border-border align-middle">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    {service.name}
                    {service.unit && <span className="block text-xs font-normal text-muted-foreground">Цена и время {service.unit}</span>}
                  </th>
                  {CAR_CLASSES.map((classId) => {
                    const cell = service.classes[classId];
                    return (
                      <td key={classId} className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <label className="flex shrink-0 items-center gap-1.5">
                            <span className="sr-only">{service.name}, {ROMAN_CLASS[classId]} класс, цена</span>
                            <input
                              type="number"
                              min={0}
                              step={50}
                              aria-label={`${service.name}, ${ROMAN_CLASS[classId]} класс, цена`}
                              value={cell.price ?? ""}
                              onChange={(event) => edit(service.id, classId, "price", event.target.value)}
                              className={`${NUMBER_INPUT} w-24 font-semibold`}
                            />
                            <span className="text-muted-foreground">₽</span>
                          </label>
                          <label className="flex shrink-0 items-center gap-1.5">
                            <span className="sr-only">{service.name}, {ROMAN_CLASS[classId]} класс, время в минутах</span>
                            <input
                              type="number"
                              min={0}
                              step={5}
                              aria-label={`${service.name}, ${ROMAN_CLASS[classId]} класс, время в минутах`}
                              value={cell.minutes ?? ""}
                              onChange={(event) => edit(service.id, classId, "minutes", event.target.value)}
                              className={`${NUMBER_INPUT} w-16`}
                            />
                            <span className="text-xs text-muted-foreground">мин</span>
                          </label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <div className="mt-3 flex shrink-0 flex-col items-stretch justify-between gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        <p className={`text-center text-sm sm:text-left ${status === "error" ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">{statusText}</p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={status === "idle" || status === "saved"}
          className="min-h-12 w-full shrink-0 rounded-xl bg-crm px-5 py-3 text-base font-semibold text-crm-foreground disabled:cursor-default disabled:opacity-50 sm:min-h-0 sm:w-36 sm:rounded-lg sm:py-2.5 sm:text-sm"
        >
          {status === "saved" ? "Сохранено" : "Сохранить"}
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-sm rounded-xl p-5"
          closeClassName="flex h-11 w-11 items-center justify-center rounded-lg sm:h-8 sm:w-8 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-4 sm:[&_svg]:w-4"
        >
          <DialogHeader className="pr-10 text-left">
            <DialogTitle className="text-xl sm:text-lg">Сохранить изменения?</DialogTitle>
            <DialogDescription className="text-base sm:text-sm">Изменённые цены и время будут записаны в прайс.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button type="button" onClick={() => setConfirmOpen(false)} className="min-h-12 rounded-xl border border-border px-4 py-3 text-base font-semibold sm:min-h-0 sm:rounded-lg sm:py-2 sm:text-sm">Отмена</button>
            <button type="button" onClick={save} className="min-h-12 rounded-xl bg-crm px-4 py-3 text-base font-semibold text-crm-foreground sm:min-h-0 sm:rounded-lg sm:py-2 sm:text-sm">Да, сохранить</button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function MobileServiceEditor({
  service,
  onEdit,
}: {
  service: CatalogService;
  onEdit: (serviceId: string, classId: CarClass, field: ServiceCellField, raw: string) => void;
}) {
  return (
    <article data-service-id={`mobile-${service.id}`} className="border-t border-border p-4">
      <h3 className="text-base font-semibold">{service.name}</h3>
      {service.unit && <p className="mt-1 text-xs text-muted-foreground">Цена и время {service.unit}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {CAR_CLASSES.map((classId) => {
          const cell = service.classes[classId];
          return (
            <div key={classId} className="rounded-xl bg-crm-surface p-3">
              <p className="text-sm font-semibold text-crm">{ROMAN_CLASS[classId]} класс</p>
              <label className="mt-2 block text-xs text-muted-foreground">
                Цена, ₽
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  aria-label={`${service.name}, ${ROMAN_CLASS[classId]} класс, цена`}
                  value={cell.price ?? ""}
                  onChange={(event) => onEdit(service.id, classId, "price", event.target.value)}
                  className={`${MOBILE_NUMBER_INPUT} font-semibold text-foreground`}
                />
              </label>
              <label className="mt-2 block text-xs text-muted-foreground">
                Время, мин
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={5}
                  aria-label={`${service.name}, ${ROMAN_CLASS[classId]} класс, время в минутах`}
                  value={cell.minutes ?? ""}
                  onChange={(event) => onEdit(service.id, classId, "minutes", event.target.value)}
                  className={`${MOBILE_NUMBER_INPUT} text-foreground`}
                />
              </label>
            </div>
          );
        })}
      </div>
    </article>
  );
}
