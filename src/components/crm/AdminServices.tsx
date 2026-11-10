import { useEffect, useState } from "react";
import {
  CAR_CLASSES, DEFAULT_SERVICE_CATALOG, SERVICE_GROUPS, updateServiceCell,
} from "@/lib/crm/services";
import type { CarClass, CatalogService, ServiceCellField } from "@/lib/crm/services";

const STORAGE_KEY = "aquarius-crm-service-catalog-v1";
const ROMAN_CLASS: Record<CarClass, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };

export function AdminServices() {
  const [catalog, setCatalog] = useState<CatalogService[]>(DEFAULT_SERVICE_CATALOG);
  const [loaded, setLoaded] = useState(false);

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
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  }, [catalog, loaded]);

  const edit = (serviceId: string, classId: CarClass, field: ServiceCellField, raw: string) => {
    const value = raw.trim() === "" ? null : Number(raw);
    setCatalog((current) => updateServiceCell(current, serviceId, classId, field, value === null || Number.isFinite(value) ? value : null));
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
      <h1 className="text-3xl font-bold tracking-tight">Услуги</h1>
      <p className="mt-1 text-muted-foreground">Редактируемый прайс по классам автомобилей</p>

      <div className="mt-4 rounded-xl border border-crm/20 bg-crm-soft px-4 py-3 text-crm">
        Цены указаны в рублях, время — в минутах. На сайте показывается цена I класса с пометкой «от».
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-crm-surface text-muted-foreground">
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
                          <label className="flex items-center gap-1.5">
                            <span className="sr-only">{service.name}, {ROMAN_CLASS[classId]} класс, цена</span>
                            <input
                              type="number"
                              min={0}
                              step={50}
                              value={cell.price ?? ""}
                              onChange={(event) => edit(service.id, classId, "price", event.target.value)}
                              className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-right font-semibold outline-none focus:border-crm"
                            />
                            <span className="text-muted-foreground">₽</span>
                          </label>
                          <label className="flex items-center gap-1.5">
                            <span className="sr-only">{service.name}, {ROMAN_CLASS[classId]} класс, время в минутах</span>
                            <input
                              type="number"
                              min={0}
                              step={5}
                              value={cell.minutes ?? ""}
                              onChange={(event) => edit(service.id, classId, "minutes", event.target.value)}
                              className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-right outline-none focus:border-crm"
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

      <p className="mt-4 text-muted-foreground">Изменения сохраняются автоматически в этом браузере.</p>
    </main>
  );
}
