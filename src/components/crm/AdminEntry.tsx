import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/crm/AdminLogin";
import { AdminSchedule } from "@/components/crm/AdminSchedule";
import { api, type CrmUser } from "@/lib/crm/api";
import { Toaster } from "@/components/ui/sonner";

export function AdminEntry() {
  const [user, setUser] = useState<CrmUser | null | "loading">("loading");

  useEffect(() => {
    api.me().then(setUser, () => setUser(null));
  }, []);

  const logout = async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
  };

  if (user === "loading") return <main className="min-h-screen bg-background" />;
  return (
    <>
      {user ? <AdminSchedule role={user.role} onLogout={logout} /> : <AdminLogin onLogin={setUser} />}
      <Toaster position="top-center" />
    </>
  );
}
