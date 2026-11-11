import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminServices } from "@/components/crm/AdminServices";

afterEach(() => vi.restoreAllMocks());

const renderServices = (role: "admin" | "owner") => {
  vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
  render(<AdminServices role={role} />);
  return screen.getAllByLabelText("Стандарт, I класс, цена");
};

describe("Права на изменение прайса", () => {
  it("администратор видит цены и время только для чтения, без сохранения", () => {
    const prices = renderServices("admin");
    const minutes = screen.getAllByLabelText("Стандарт, I класс, время в минутах");

    for (const input of [...prices, ...minutes]) expect(input).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument();
    expect(screen.getByText("Просмотр прайса. Изменять цены и время может только владелец.")).toBeInTheDocument();
  });

  it("владелец может редактировать цены и сохранять прайс", () => {
    const prices = renderServices("owner");

    for (const input of prices) expect(input).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
  });
});
