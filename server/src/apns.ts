import { SignJWT, importPKCS8 } from "jose";

// Ключ .p8 от Apple передаётся base64-строкой в APNS_KEY_BASE64 (файл многострочный).
const KEY_ID = process.env.APNS_KEY_ID ?? "";
const TEAM_ID = process.env.APNS_TEAM_ID ?? "";
const BUNDLE = process.env.APNS_BUNDLE_ID ?? "ru.aquariuswash";
const KEY_B64 = process.env.APNS_KEY_BASE64 ?? "";
// TestFlight и App Store работают через боевой APNs; sandbox — только для сборок из Xcode.
const HOST = process.env.APNS_PRODUCTION === "false" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";

export const apnsEnabled = Boolean(KEY_ID && TEAM_ID && KEY_B64);

// Apple просит переиспользовать JWT до часа; обновляем каждые ~50 минут.
let cached: { jwt: string; iat: number } | null = null;
async function authToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && now - cached.iat < 3000) return cached.jwt;
  const key = await importPKCS8(Buffer.from(KEY_B64, "base64").toString("utf8"), "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: KEY_ID })
    .setIssuer(TEAM_ID)
    .setIssuedAt(now)
    .sign(key);
  cached = { jwt, iat: now };
  return jwt;
}

export type ApnsResult = "ok" | "dead" | "error";

/** Sends one APNs alert to an iOS device; «dead» means the token must be dropped. */
export async function sendApns(token: string, msg: { title: string; body: string; data: Record<string, string> }): Promise<ApnsResult> {
  const res = await fetch(`${HOST}/3/device/${token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${await authToken()}`,
      "apns-topic": BUNDLE,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify({ aps: { alert: { title: msg.title, body: msg.body }, sound: "default" }, ...msg.data }),
  }).catch((e) => { console.error("apns", e); return null; });
  if (!res) return "error";
  if (res.ok) return "ok";
  const text = await res.text();
  if (res.status === 410 || /BadDeviceToken|Unregistered/.test(text)) return "dead";
  console.error("apns failed", res.status, text);
  return "error";
}
