import { mkdir, readdir } from "node:fs/promises";
import { carClass } from "../../src/lib/crm/car-class";
import type { CarClass } from "../../src/lib/crm/services";

const BASE = "https://api.cars-base.ru";
const DAY = 24 * 60 * 60_000;
const token = () => process.env["CARSBASE_TOKEN"] ?? "";
const LOGO_DIR = () => process.env["CARSBASE_LOGO_DIR"] ?? "/var/lib/aquarius/logos";

type FullMark = { id: string; name: string; cyrillic_name: string; models: { id: string; name: string; cyrillic_name: string; year_to: number | null }[] };
export type CarHit = { modelId: string; markId: string; name: string };
export type CarInfo = { cls: CarClass; body: string };

async function get<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${encodeURIComponent(token())}`);
  if (!res.ok) throw new Error(`Cars Base ${res.status}`);
  return (await res.json()) as T;
}

let full: { at: number; list: (CarHit & { search: string })[] } | null = null;
async function models() {
  if (full && Date.now() - full.at < DAY) return full.list;
  const { data } = await get<{ data: FullMark[] }>("/full");
  const list = data.flatMap((m) => m.models.map((md) => ({
    modelId: md.id, markId: m.id, name: `${m.name} ${md.name}`,
    search: `${m.name} ${md.name} ${m.cyrillic_name} ${md.cyrillic_name}`.toLowerCase(),
  })));
  full = { at: Date.now(), list };
  return list;
}

export async function searchCars(q: string): Promise<CarHit[]> {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return (await models()).filter((m) => words.every((w) => m.search.includes(w))).slice(0, 12)
    .map(({ modelId, markId, name }) => ({ modelId, markId, name }));
}

const infoCache = new Map<string, { at: number; info: CarInfo }>();
/** Класс по последнему поколению: берём основной (самый короткий) кузов, а не удлинённые версии. */
export async function carInfo(modelId: string): Promise<CarInfo> {
  const hit = infoCache.get(modelId);
  if (hit && Date.now() - hit.at < DAY) return hit.info;
  const id = encodeURIComponent(modelId);
  const gens = (await get<{ data: { id: string; year_from: number }[] }>(`/generations?model_id=${id}&pageSize=100`)).data;
  const gen = gens.sort((a, b) => b.year_from - a.year_from)[0];
  const confs = (await get<{ data: { id: string; generation_id: string; name: string; body_type: string }[] }>(`/configurations?model_id=${id}&pageSize=200`)).data
    .filter((c) => !gen || c.generation_id === gen.id);
  let best: CarInfo | null = null;
  for (const c of confs.slice(0, 6)) {
    const mod = (await get<{ data: { id: string }[] }>(`/modifications?configuration_id=${c.id}&pageSize=1`)).data[0];
    const spec = mod ? (await get<{ data: { body_size?: string }[] }>(`/specifications?id=${encodeURIComponent(mod.id)}`)).data[0] : undefined;
    const len = Number(spec?.body_size) || null;
    const cls = carClass(c.body_type, len);
    if (!best || cls < best.cls) best = { cls, body: c.name.replace(/\s*\d дв\..*$/, "").toLowerCase() };
  }
  const info = best ?? { cls: 1 as CarClass, body: "" };
  infoCache.set(modelId, { at: Date.now(), info });
  return info;
}

let logosReady: Promise<void> | null = null;
/** Логотипы есть только архивом — один раз скачиваем и распаковываем на сервер. */
export async function logoFile(markId: string): Promise<string | null> {
  if (!/^[A-Z0-9_-]+$/i.test(markId)) return null;
  const dir = LOGO_DIR();
  logosReady ??= (async () => {
    await mkdir(dir, { recursive: true });
    if ((await readdir(dir)).length) return;
    const res = await fetch(`${BASE}/download/logos.zip?token=${encodeURIComponent(token())}`);
    if (!res.ok) throw new Error(`Cars Base logos ${res.status}`);
    const zip = `${dir}/logos.zip`;
    await Bun.write(zip, res);
    await Bun.spawn(["unzip", "-o", "-j", "-q", zip, "*.png", "-d", dir]).exited;
  })().catch((e) => { logosReady = null; throw e; });
  await logosReady;
  const f = Bun.file(`${dir}/${markId}.png`);
  return (await f.exists()) ? f.name! : null;
}
