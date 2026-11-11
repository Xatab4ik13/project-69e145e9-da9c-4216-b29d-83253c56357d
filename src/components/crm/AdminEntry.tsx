import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/crm/AdminLogin";
import { AdminSchedule } from "@/components/crm/AdminSchedule";

const MOCK_AUTH_KEY = "aquarius.crm.mock-auth";

export function AdminEntry() {
  const [status, setStatus] = useState<"loading" | "guest" | "authenticated">("loading");

  useEffect(() => {
    try {
      setStatus(window.localStorage.getItem(MOCK_AUTH_KEY) === "1" ? "authenticated" : "guest");
    } catch {
      setStatus("guest");
    }
  }, []);

  const login = () => {
    try {
      window.localStorage.setItem(MOCK_AUTH_KEY, "1");
    } catch {
      // The mock session still works until this tab is closed.
    }
    setStatus("authenticated");
  };

  if (status === "loading") return <main className="min-h-screen bg-background" />;
  return status === "authenticated" ? <AdminSchedule /> : <AdminLogin onLogin={login} />;
}
