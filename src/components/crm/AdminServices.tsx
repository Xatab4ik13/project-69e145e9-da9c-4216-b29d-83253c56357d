import { SERVICE_CATALOG, classPriceLabel, sitePriceLabel } from "@/lib/crm/services";

export function AdminServices() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
      <h1 className="text-3xl font-bold tracking-tight">Услуги</h1>
      <p className="mt-1 text-muted-foreground">Все услуги автомойки и цены по классам автомобилей</p>

      <div className="mt-4 rounded-xl border border-crm/20 bg-crm-soft px-4 py-3 text-crm">
        Цена «от» на сайте соответствует цене автомобиля 1-го класса.
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-crm-surface text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Услуга</th>
              <th className="px-4 py-3 font-medium">Раздел на сайте</th>
              <th className="px-4 py-3 font-medium">Цена на сайте</th>
              <th className="px-4 py-3 font-medium">1-й класс</th>
            </tr>
          </thead>
          <tbody>
            {SERVICE_CATALOG.map((service) => (
              <tr key={`${service.category}-${service.name}`} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{service.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{service.category}</td>
                <td className="px-4 py-3 font-semibold">{sitePriceLabel(service)}</td>
                <td className="px-4 py-3 font-semibold">{classPriceLabel(service, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-muted-foreground">Цены остальных классов можно будет добавить после настройки классов автомобилей.</p>
    </main>
  );
}
