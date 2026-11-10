import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminNotificationIndicator } from "@/components/crm/AdminNotificationIndicator";
import {
  CAR_CLASSES, DEFAULT_SERVICE_CATALOG, SERVICE_GROUPS, updateServiceCell,
} from "@/lib/crm/services";
import type { CarClass, CatalogService, ServiceCellField } from "@/lib/crm/services";

const STORAGE_KEY = "aquarius-crm-service-catalog-v1";
const ROMAN_CLASS: Record<CarClass, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
const NUMBER_INPUT = "shrink-0 rounded-md border border-border bg-background px-2 py-1.5 text-right tabular-nums outline-none focus:border-crm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

type SaveStatus = "idle" | "dirty" | "saved" | "error";

export function AdminServices() {
  const [catalog, setCatalog] = useState<CatalogService[]>(DEFAULT_SERVICE_CATALOG);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SERVICE_CATALOG.length) setCatalog(parsed as CatalogService[]);
      }
    } catch {
      // A broken local draft must not prevent the default price list from opening.
    }
  }, []);

  const edit = (serviceId: string, classId: CarClass, field: ServiceCellField, raw: string) => {
    const value = raw.trim() === "" ? null : Number(raw);
    setCatalog((current) => updateServiceCell(current, serviceId, classId, field, value === null || Number.isFinite(value) ? value : null));
    setStatus("dirty");
  };

  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
      setStatus("saved");
    } catch {
      setStatus("error");
    }
    setConfirmOpen(false);
  };

  const statusText = {
    idle: "Цены и время можно изменить вручную.",
    dirty: "Есть несохранённые изменения.",
    saved: "Изменения сохранены.",
    error: "Не удалось сохранить. Попробуйте ещё раз.",
  }[status];

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-6 pb-4 pt-5">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Услуги</h1>
          <p className="mt-1 text-muted-foreground">Редактируемый прайс по классам автомобилей</p>
        </div>
        <div className="ml-auto"><AdminNotificationIndicator /></div>
      </div>

      <div className="mt-4 shrink-0 rounded-xl border border-crm/20 bg-crm-soft px-4 py-3 text-crm">
        Цены указаны в рублях, время — в минутах. На сайте показывается цена I класса с пометкой «от».
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-auto rounded-xl border border-border">
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
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

      <div className="mt-3 flex shrink-0 items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
        <p className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">{statusText}</p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={status === "idle" || status === "saved"}
          className="w-36 shrink-0 rounded-lg bg-crm px-5 py-2.5 font-semibold text-crm-foreground disabled:cursor-default disabled:opacity-50"
        >
          {status === "saved" ? "Сохранено" : "Сохранить"}
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Сохранить изменения?</DialogTitle>
            <DialogDescription>Изменённые цены и время будут записаны в прайс.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-border px-4 py-2 font-semibold">Отмена</button>
            <button type="button" onClick={save} className="rounded-lg bg-crm px-4 py-2 font-semibold text-crm-foreground">Да, сохранить</button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
