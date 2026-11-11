import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { enablePush, pushState, type PushState } from "@/lib/crm/push";

const HINT: Record<PushState, string> = {
  preview: "Уведомления работают в приложении на crm.aquariuswash.ru",
  "ios-install": "На iPhone: «Поделиться» → «На экран Домой», затем откройте CRM с иконки",
  unsupported: "Этот браузер не поддерживает уведомления",
  denied: "Уведомления запрещены — разрешите их в настройках браузера для этого сайта",
  default: "Включить уведомления",
  enabled: "Уведомления включены",
};

/** Bell in the top corner: turns on push for «Новая запись» and «Подтвердите запись». */
export function AdminNotificationIndicator() {
  const [state, setState] = useState<PushState | null>(null);

  useEffect(() => {
    pushState().then(setState, () => setState("unsupported"));
  }, []);

  const onClick = async () => {
    try {
      const next = await enablePush();
      setState(next);
      if (next === "enabled") toast.success("Уведомления включены");
      else toast(HINT[next]);
    } catch {
      toast.error("Не удалось включить уведомления. Попробуйте ещё раз.");
    }
  };

  const enabled = state === "enabled";
  const Icon = enabled ? BellRing : Bell;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={state ? HINT[state] : "Уведомления"}
      title={state ? HINT[state] : "Уведомления"}
      className={`shrink-0 rounded-full p-2 transition-colors hover:bg-muted ${enabled ? "text-foreground" : "text-muted-foreground"}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
