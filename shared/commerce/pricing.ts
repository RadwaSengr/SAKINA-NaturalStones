import type { Money } from "./types";

export const STANDARD_DELIVERY_PIASTERS = 11_800;
export const TASBIH_BASE_PIASTERS = 50_000;
export const TASBIH_PER_ADDITIONAL_STONE_PIASTERS = 5_000;
export const TASBIH_MAX_PIASTERS = 100_000;

export function calculateTasbihAssemblyPiasters(stoneCount: number) {
  if (!Number.isInteger(stoneCount) || stoneCount < 1) throw new Error("At least one stone is required for tasbih assembly");
  return Math.min(
    TASBIH_BASE_PIASTERS + Math.max(0, stoneCount - 1) * TASBIH_PER_ADDITIONAL_STONE_PIASTERS,
    TASBIH_MAX_PIASTERS
  );
}

export function piastersToMoney(value: number): Money {
  return { amount: (value / 100).toFixed(2), currencyCode: "EGP" };
}
