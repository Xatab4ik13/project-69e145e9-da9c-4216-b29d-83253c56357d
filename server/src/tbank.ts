/**
 * Интернет-эквайринг Т-Банка (API v2). Тестовый и боевой терминал работают
 * через один адрес — отличаются только TBANK_TERMINAL_KEY / TBANK_PASSWORD в env.
 */
const API = "https://securepay.tinkoff.ru/v2";

/** Подпись запроса: корневые простые поля + Password, сортировка по ключу, склейка значений, SHA-256. */
export function tbankToken(params: Record<string, unknown>, password: string): string {
  const flat: Record<string, string> = { Password: password };
  for (const [k, v] of Object.entries(params)) {
    if (k === "Token" || v === null || v === undefined || typeof v === "object") continue;
    flat[k] = String(v);
  }
  const joined = Object.keys(flat).sort().map((k) => flat[k]).join("");
  return new Bun.CryptoHasher("sha256").update(joined).digest("hex");
}

export const tbankConfigured = () => !!process.env.TBANK_TERMINAL_KEY && !!process.env.TBANK_PASSWORD;

export function verifyNotification(body: Record<string, unknown>): boolean {
  const password = process.env.TBANK_PASSWORD;
  if (!password || typeof body.Token !== "string") return false;
  if (body.TerminalKey !== process.env.TBANK_TERMINAL_KEY) return false;
  return tbankToken(body, password) === body.Token;
}

type InitResult = { ok: true; paymentId: string; paymentUrl: string } | { ok: false; error: string };

/** Чек 54-ФЗ (чеки Т-Банка без своей кассы): одна позиция на сумму к оплате, УСН доходы, без НДС. */
export function tbankReceipt(phone10: string, amountKop: number, name: string) {
  return {
    Phone: `+7${phone10}`,
    Taxation: process.env.TBANK_TAXATION ?? "usn_income",
    Items: [{ Name: name.slice(0, 128), Price: amountKop, Quantity: 1, Amount: amountKop, Tax: "none", PaymentMethod: "full_payment", PaymentObject: "service" }],
  };
}

export async function tbankInit(orderId: string, amountKop: number, description: string, phone10: string): Promise<InitResult> {
  const TerminalKey = process.env.TBANK_TERMINAL_KEY!;
  const params: Record<string, unknown> = {
    TerminalKey, Amount: amountKop, OrderId: orderId, Description: description.slice(0, 140),
    Receipt: tbankReceipt(phone10, amountKop, description),
    NotificationURL: process.env.TBANK_NOTIFY_URL ?? "https://crm.aquariuswash.ru/api/v1/payments/tbank/notify",
    ...(process.env.TBANK_SUCCESS_URL ? { SuccessURL: process.env.TBANK_SUCCESS_URL } : {}),
    ...(process.env.TBANK_FAIL_URL ? { FailURL: process.env.TBANK_FAIL_URL } : {}),
  };
  params.Token = tbankToken(params, process.env.TBANK_PASSWORD!);
  try {
    const res = await fetch(`${API}/Init`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params) });
    const data = (await res.json()) as { Success?: boolean; PaymentId?: string | number; PaymentURL?: string; Message?: string; Details?: string };
    if (!data.Success || !data.PaymentURL) return { ok: false, error: [data.Message, data.Details].filter(Boolean).join(": ") || "Банк отклонил платёж" };
    const paymentId = String(data.PaymentId);
    // Только СБП: берём ссылку СБП (qr.nspk.ru) — на телефоне она сразу открывает выбор банка, без ввода карты.
    const sbp = await tbankSbpLink(paymentId);
    if (!sbp) console.error("tbank getqr failed, fallback to payment page");
    return { ok: true, paymentId, paymentUrl: sbp ?? data.PaymentURL };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** GetQr с DataType=PAYLOAD возвращает ссылку СБП для оплаты с мобильного. */
export async function tbankSbpLink(paymentId: string): Promise<string | null> {
  const params: Record<string, unknown> = { TerminalKey: process.env.TBANK_TERMINAL_KEY!, PaymentId: paymentId, DataType: "PAYLOAD" };
  params.Token = tbankToken(params, process.env.TBANK_PASSWORD!);
  try {
    const res = await fetch(`${API}/GetQr`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params) });
    const data = (await res.json()) as { Success?: boolean; Data?: string; Message?: string; Details?: string };
    if (!data.Success || !data.Data) { console.error("tbank getqr", data.Message, data.Details); return null; }
    return data.Data;
  } catch (e) { console.error("tbank getqr", e); return null; }
}
