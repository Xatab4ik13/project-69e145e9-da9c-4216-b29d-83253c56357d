import { Banknote, Check, Clock, Phone, Smartphone } from "lucide-react";
import type { BookingState } from "@/lib/crm/logic";

/** One look-and-feel per booking state on desktop and mobile. */
export const TONE: Record<BookingState, { card: string; badge: string; chip: string; Icon: typeof Phone }> = {
  call: { card: "border-2 border-crm-alert-foreground bg-crm-alert text-crm-alert-foreground", badge: "bg-crm-alert-foreground text-crm-foreground", chip: "bg-crm-alert-foreground/10", Icon: Phone },
  unconfirmed: { card: "border border-crm-warn-foreground/50 bg-crm-warn text-crm-warn-foreground", badge: "bg-crm-warn-foreground/15 text-crm-warn-foreground", chip: "bg-crm-warn-foreground/10", Icon: Clock },
  confirmed: { card: "border border-crm/25 bg-crm-soft text-crm", badge: "bg-crm text-crm-foreground", chip: "bg-crm/10", Icon: Check },
  working: { card: "border-2 border-crm bg-crm text-crm-foreground", badge: "bg-crm-foreground/20 text-crm-foreground", chip: "bg-crm-foreground/20", Icon: Clock },
  ready: { card: "border border-crm-money-foreground/50 bg-crm-money text-crm-money-foreground", badge: "bg-crm-money-foreground/15 text-crm-money-foreground", chip: "bg-crm-money-foreground/10", Icon: Banknote },
  awaiting: { card: "border border-crm-money-foreground/50 bg-crm-money text-crm-money-foreground", badge: "bg-crm-money-foreground/15 text-crm-money-foreground", chip: "bg-crm-money-foreground/10", Icon: Smartphone },
  finished: { card: "border border-border bg-muted text-muted-foreground", badge: "bg-crm-ok text-crm-ok-foreground", chip: "bg-background", Icon: Check },
};
