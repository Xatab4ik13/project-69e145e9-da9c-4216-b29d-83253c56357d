import type { ClientCar } from "./clients";

/** Demo garage data; client totals and accounts come from the shared CRM mocks. */
export const MOCK_CLIENT_CARS: Record<string, ClientCar[]> = {
  lc1: [{ id: "car-1", name: "Hyundai Solaris", carClass: 1, primary: true }],
  lc2: [
    { id: "car-2", name: "Renault Logan", carClass: 1, primary: true },
    { id: "car-3", name: "Hyundai Creta", carClass: 2, primary: false },
  ],
  lc3: [
    { id: "car-4", name: "Kia Rio", carClass: 1, primary: true },
    { id: "car-5", name: "Kia Sportage", carClass: 3, primary: false },
  ],
  lc4: [{ id: "car-6", name: "Skoda Rapid", carClass: 1, primary: true }],
  lc5: [{ id: "car-7", name: "Lada Vesta", carClass: 1, primary: true }],
  lc6: [
    { id: "car-8", name: "Toyota Camry", carClass: 1, primary: true },
    { id: "car-9", name: "Volkswagen Multivan", carClass: 4, primary: false },
  ],
  lc7: [{ id: "car-10", name: "Toyota Corolla", carClass: 1, primary: true }],
};

export const MOCK_CLIENT_FIRST_CONTACT: Record<string, string> = {
  lc1: "2026-09-12",
  lc2: "2026-10-24",
  lc3: "2026-08-19",
  lc4: "2026-11-11",
  lc5: "2026-11-11",
  lc6: "2025-11-20",
  lc7: "2026-11-11",
};
