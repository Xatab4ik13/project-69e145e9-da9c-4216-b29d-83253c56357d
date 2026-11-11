import { api } from "./api";

export type PushState = "unsupported" | "preview" | "ios-install" | "default" | "denied" | "enabled";

const isCrmHost = () => window.location.hostname.toLowerCase() === "crm.aquariuswash.ru";
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

function keyBytes(base64: string) {
  const b = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b), (ch) => ch.charCodeAt(0));
}

const registration = () => navigator.serviceWorker.register("/push-sw.js", { scope: "/" });

export async function pushState(): Promise<PushState> {
  if (!isCrmHost() || window.top !== window.self) return "preview";
  if (isIos() && !isStandalone()) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "default";
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return "default";
  // Refresh on the server in case the device was re-linked to another login.
  await api.pushSubscribe(sub.toJSON()).catch(() => undefined);
  return "enabled";
}

/** Must run from a tap: browsers only ask for permission after a user action. */
export async function enablePush(): Promise<PushState> {
  const state = await pushState();
  if (state !== "default") return state;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "default";
  const { key } = await api.pushKey();
  if (!key) return "unsupported";
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
  await api.pushSubscribe(sub.toJSON());
  return "enabled";
}
