import type { CarClass } from "./services";

/** Длина кузова, с которой кроссовер / SUV относится к III классу. */
export const SUV_III_FROM_MM = 4800;

const SUV = /^(ALLROAD|PICKUP)/;
const VAN = /^(MINIVAN|COMPACTVAN|MICROVAN|VAN)/;

/**
 * Правила Aquarius: минивэны — IV; кроссоверы/SUV короче 4800 мм — II, от 4800 мм — III;
 * седаны, хэтчбеки и остальные легковые — I. SUV без известной длины считаем III.
 */
export function carClass(bodyType: string, lengthMm: number | null): CarClass {
  const b = bodyType.toUpperCase();
  if (VAN.test(b)) return 4;
  if (SUV.test(b)) return lengthMm != null && lengthMm < SUV_III_FROM_MM ? 2 : 3;
  return 1;
}

export const CLASS_LABEL: Record<CarClass, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
