/** Shared car list of one client (site, app and CRM): at most 5, the 6th replaces the one used longest ago. */
export const MAX_CLIENT_CARS = 5;

export type StoredCar = { car: string; lastUsed: string };

/** Name of the car to drop before saving `car`, or null when nothing has to go. */
export function carToEvict(cars: StoredCar[], car: string): string | null {
  const name = car.trim();
  if (!name || cars.some((c) => c.car === name) || cars.length < MAX_CLIENT_CARS) return null;
  return [...cars].sort((a, b) => a.lastUsed.localeCompare(b.lastUsed))[0]!.car;
}
