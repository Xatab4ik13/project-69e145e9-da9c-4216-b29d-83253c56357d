/** Отправка кода входа по SMS через SMSPilot (v2). Ключ — SMSPILOT_TOKEN в env сервера. */
export async function sendSmsCode(phone10: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.SMSPILOT_TOKEN;
  if (!token) return { ok: false, error: "SMSPILOT_TOKEN не настроен" };
  try {
    const res = await fetch("https://smspilot.ru/v2/send", {
      method: "POST",
      headers: { "X-Service-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients: [`7${phone10}`],
        message: { text: `Код для входа в Aquarius: ${code}`, sender: process.env.SMSPILOT_SENDER ?? "Aquarius" },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok || /"error"/i.test(text)) return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
