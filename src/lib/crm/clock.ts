/** The wash works on Moscow time; the browser or server clock may be in another zone. */
export const WASH_TIME_ZONE = "Europe/Moscow";

export function washNow(at: Date = new Date()): { today: string; nowMin: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: WASH_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(at).map((p) => [p.type, p.value]),
  );
  return { today: `${parts.year}-${parts.month}-${parts.day}`, nowMin: Number(parts.hour) * 60 + Number(parts.minute) };
}
