import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminLogin } from "@/components/crm/AdminLogin";

describe("Mock CRM login", () => {
  it("accepts any non-empty login and password", () => {
    const onLogin = vi.fn();
    render(<AdminLogin onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText("Логин"), { target: { value: "anything" } });
    fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(onLogin).toHaveBeenCalledOnce();
  });

  it("shows and hides the password", () => {
    render(<AdminLogin onLogin={() => {}} />);
    const password = screen.getByLabelText("Пароль");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Показать пароль" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Скрыть пароль" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
