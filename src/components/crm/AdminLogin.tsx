import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { aquarius_logo as logo } from "@/assets/images";
import { Input } from "@/components/ui/input";
import { api, type CrmUser } from "@/lib/crm/api";

export function AdminLogin({ onLogin }: { onLogin: (user: CrmUser) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!login.trim() || !password || busy) return;
    setBusy(true);
    setError("");
    api.login(login.trim(), password).then(onLogin, (e: Error) => setError(e.message)).finally(() => setBusy(false));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <img src={logo.url} alt="Aquarius" width={200} height={78} className="mx-auto h-20 w-auto" />
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div className="text-sm font-medium">
            <label htmlFor="crm-login">Логин</label>
            <Input
              id="crm-login"
              name="login"
              type="text"
              autoComplete="username"
              required
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="mt-2 h-12 bg-background text-base"
            />
          </div>
          <div className="text-sm font-medium">
            <label htmlFor="crm-password">Пароль</label>
            <div className="relative mt-2">
              <Input
                id="crm-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 bg-background pr-12 text-base"
              />
              <button
                type="button"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="btn-lime h-12 w-full rounded-lg text-base disabled:opacity-60">
            {busy ? "Входим…" : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}
