import { useEffect, useState } from "react";
import { washNow } from "./clock";

/** Moscow date and minute, refreshed every 30 seconds for the time line and past slots. */
export function useWashClock() {
  const [clock, setClock] = useState(washNow);
  useEffect(() => {
    const id = window.setInterval(() => setClock(washNow()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return clock;
}
