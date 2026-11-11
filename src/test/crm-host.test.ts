import { describe, expect, it } from "vitest";
import { appHost } from "@/lib/crm/host";

describe("CRM hostname", () => {
  it("opens the CRM at the root of crm.aquariuswash.ru", () => {
    expect(appHost("crm.aquariuswash.ru")).toBe("crm");
    expect(appHost("crm.aquariuswash.ru:443")).toBe("crm");
  });

  it("keeps the public website on aquariuswash.ru and www", () => {
    expect(appHost("aquariuswash.ru")).toBe("site");
    expect(appHost("www.aquariuswash.ru")).toBe("site");
  });

  it("keeps /admin available in the development preview", () => {
    expect(appHost("localhost:8080")).toBe("preview");
  });
});
