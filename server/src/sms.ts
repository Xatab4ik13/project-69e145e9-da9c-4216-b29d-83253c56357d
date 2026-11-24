/** Отправка кода входа по SMS через SMSPilot (api.php). Ключ — SMSPILOT_TOKEN в env сервера. */
export async function sendSmsCode(phone10: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.SMSPILOT_TOKEN;
  if (!token) return { ok: false, error: "SMSPILOT_TOKEN не настроен" };
  const form = new URLSearchParams({
    send: `Код для входа в Aquarius: ${code}`,
    to: `7${phone10}`,
    from: process.env.SMSPILOT_SENDER ?? "Aquarius",
    apikey: token,
    format: "json",
  });
  try {
    const res = await fetch("https://smspilot.ru/api.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok || !text.includes('"send"') || text.includes('"error"')) {
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
