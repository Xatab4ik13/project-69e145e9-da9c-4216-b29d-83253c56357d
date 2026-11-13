/**
 * Отправка кода входа через Telegram Gateway (gatewayapi.telegram.org).
 * Из России API Telegram недоступен, поэтому запрос идёт через SOCKS5-прокси.
 * Bun.fetch не умеет SOCKS, поэтому используем curl через Bun.spawn.
 */

const GATEWAY_URL = "https://gatewayapi.telegram.org/sendVerificationMessage";

export async function sendTelegramCode(phoneE164: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_GATEWAY_TOKEN;
  const proxy = process.env.TELEGRAM_PROXY;
  if (!token) return { ok: false, error: "TELEGRAM_GATEWAY_TOKEN не настроен" };

  const args = [
    "-sS", "-m", "15",
    ...(proxy ? ["-x", proxy] : []),
    "-X", "POST", GATEWAY_URL,
    "-H", `Authorization: Bearer ${token}`,
    "-H", "Content-Type: application/json",
    "-d", JSON.stringify({ phone_number: phoneE164, code, ttl: 300 }),
  ];

  try {
    const proc = Bun.spawn(["curl", ...args], { stdout: "pipe", stderr: "pipe" });
    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    const code2 = await proc.exited;
    if (code2 !== 0) return { ok: false, error: `curl: ${err.trim() || `exit ${code2}`}` };
    const data = JSON.parse(out) as { ok?: boolean; error?: string };
    if (!data.ok) return { ok: false, error: data.error || "Telegram отклонил запрос" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
