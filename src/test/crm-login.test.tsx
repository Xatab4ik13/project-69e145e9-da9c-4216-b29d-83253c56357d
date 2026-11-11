import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminLogin } from "@/components/crm/AdminLogin";

const answer = (status: number, body: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

const submit = (login: string, password: string) => {
  fireEvent.change(screen.getByLabelText("Логин"), { target: { value: login } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Войти" }));
};

describe("CRM login", () => {
  it("signs in with the role the server returns", async () => {
    answer(200, { login: "owner", role: "owner" });
    const onLogin = vi.fn();
    render(<AdminLogin onLogin={onLogin} />);
    submit("owner", "secret123");
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ login: "owner", role: "owner" }));
  });

  it("shows the server error for a wrong password", async () => {
    answer(401, { error: "Неверный логин или пароль" });
    const onLogin = vi.fn();
    render(<AdminLogin onLogin={onLogin} />);
    submit("owner", "bad");
    expect(await screen.findByRole("alert")).toHaveTextContent("Неверный логин или пароль");
    expect(onLogin).not.toHaveBeenCalled();
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
