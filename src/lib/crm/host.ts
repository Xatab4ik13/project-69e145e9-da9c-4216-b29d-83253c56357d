export type AppHost = "site" | "crm" | "preview";

/** Hostname routing keeps the installed CRM separate from the public website. */
export function appHost(host: string | null): AppHost {
  const hostname = host?.trim().toLowerCase().split(":")[0];
  if (hostname === "crm.aquariuswash.ru" || hostname === "crm.localhost") return "crm";
  if (hostname === "aquariuswash.ru" || hostname === "www.aquariuswash.ru") return "site";
  return "preview";
}
