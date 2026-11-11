import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminWashers } from "@/components/crm/AdminWashers";
import type { FinOp } from "@/lib/crm/finance";
import type { Booking } from "@/lib/crm/types";

const today = "2026-11-11";
let id = 0;
const booking = (date: string, washer: string, price: number): Booking => ({
  id: `booking-${++id}`,
  date,
  box: 1,
  start: 12 * 60,
  duration: 60,
  car: "Kia Rio",
  carType: "Седан",
  source: "site",
  packageName: "Стандарт",
  services: [{ name: "Мойка", price }],
  wash: "done",
  confirmed: true,
  payment: "paid",
  paymentMethod: "cash",
  washer,
});

const bookings = [
  booking("2026-11-11", "Рома", 1000),
  booking("2026-11-10", "Рома", 2000),
  booking("2026-11-11", "Малик", 4000),
  booking("2026-10-01", "Сергей", 10000),
];
const ops: FinOp[] = [
  { id: "p1", date: "2026-11-11", kind: "payout", washer: "Рома", name: "Выплата", amount: 300 },
  { id: "p2", date: "2026-11-10", kind: "payout", washer: "Рома", name: "Выплата", amount: 500 },
  { id: "p3", date: "2026-11-01", kind: "payout", washer: "Малик", name: "Выплата", amount: 200 },
  { id: "p4", date: "2026-10-02", kind: "payout", washer: "Сергей", name: "Выплата", amount: 1000 },
];

const metric = (label: string) => screen.getByText(label).parentElement!;
const washer = (name: string) => within(screen.getByRole("article", { name: `Мойщик ${name}` }));

describe("Страница расчётов мойщиков", () => {
  it("считает общий заработок, выплаты за месяц и долг на сегодня", () => {
    render(<AdminWashers bookings={bookings} ops={ops} today={today} />);

    expect(within(metric("Всего заработали")).getByText("2 100 ₽")).toBeInTheDocument();
    expect(within(metric("Выплачено за период")).getByText("1 000 ₽")).toBeInTheDocument();
    expect(within(metric("Общий долг на сегодня")).getByText("3 100 ₽")).toBeInTheDocument();
    expect(washer("Рома").getByText("900 ₽")).toBeInTheDocument();
    expect(washer("Рома").getByText("800 ₽")).toBeInTheDocument();
    expect(washer("Сергей").getByText("2 000 ₽")).toBeInTheDocument();
  });

  it("фильтрует начисления и выплаты по дню, сохраняя общий долг", () => {
    render(<AdminWashers bookings={bookings} ops={ops} today={today} />);

    fireEvent.click(screen.getByRole("button", { name: "День", exact: true }));

    expect(within(metric("Всего заработали")).getByText("1 500 ₽")).toBeInTheDocument();
    expect(within(metric("Выплачено за период")).getByText("300 ₽")).toBeInTheDocument();
    expect(within(metric("Общий долг на сегодня")).getByText("3 100 ₽")).toBeInTheDocument();
  });

  it("фильтрует начисления и выплаты по произвольному периоду", () => {
    render(<AdminWashers bookings={bookings} ops={ops} today={today} />);

    fireEvent.click(screen.getByRole("button", { name: "Период", exact: true }));
    fireEvent.change(screen.getByLabelText("Начало периода"), { target: { value: "2026-11-10" } });
    fireEvent.change(screen.getByLabelText("Конец периода"), { target: { value: "2026-11-10" } });

    expect(within(metric("Всего заработали")).getByText("600 ₽")).toBeInTheDocument();
    expect(within(metric("Выплачено за период")).getByText("500 ₽")).toBeInTheDocument();
    expect(within(metric("Общий долг на сегодня")).getByText("3 100 ₽")).toBeInTheDocument();
  });
});
