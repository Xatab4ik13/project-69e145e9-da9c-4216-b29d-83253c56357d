import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminFinance } from "@/components/crm/AdminFinance";
import type { FinOp } from "@/lib/crm/finance";

const payment: FinOp = {
  id: "op-1",
  date: "2026-11-10",
  kind: "expense",
  article: "utilities",
  name: "Коммуналка",
  amount: 24851,
};

function renderFinance(onRemoveOp = vi.fn()) {
  render(
    <AdminFinance
      bookings={[]}
      ops={[payment]}
      overrides={{}}
      today="2026-11-11"
      onAddOp={vi.fn()}
      onRemoveOp={onRemoveOp}
      onPlanChange={vi.fn()}
    />,
  );
  return onRemoveOp;
}

describe("Удаление платежа", () => {
  it("не удаляет платёж по нажатию на корзину без подтверждения", () => {
    const onRemoveOp = renderFinance();

    fireEvent.click(screen.getByRole("button", { name: "Удалить Коммуналка" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(onRemoveOp).not.toHaveBeenCalled();
  });

  it("удаляет платёж только после подтверждения", () => {
    const onRemoveOp = renderFinance();

    fireEvent.click(screen.getByRole("button", { name: "Удалить Коммуналка" }));
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));

    expect(onRemoveOp).toHaveBeenCalledOnce();
    expect(onRemoveOp).toHaveBeenCalledWith("op-1");
  });
});
