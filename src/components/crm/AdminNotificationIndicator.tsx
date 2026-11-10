import { Bell } from "lucide-react";

/** Placeholder for the PWA notification center; intentionally not interactive yet. */
export function AdminNotificationIndicator() {
  return (
    <span
      role="img"
      aria-label="Уведомления"
      title="Уведомления станут доступны в PWA-версии"
      className="shrink-0 p-2 text-muted-foreground"
    >
      <Bell className="h-5 w-5" />
    </span>
  );
}
