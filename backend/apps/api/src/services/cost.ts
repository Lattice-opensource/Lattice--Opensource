import type { Tariff } from '@lattice/contracts';

/**
 * Cost for a given amount of energy under a tariff (INR).
 *
 * Slab tariffs are applied "window-local": the slabs restart at the beginning of
 * the window being costed. True billing-period-anchored costing (cumulative
 * against the monthly register) is a v2 item; see docs/api.md.
 */
export function costForEnergy(tariff: Tariff, energyKwh: number): number {
  if (energyKwh <= 0) return 0;
  if (tariff.type === 'flat') {
    return energyKwh * tariff.rateInrPerKwh;
  }
  // slab
  let remaining = energyKwh;
  let prevLimit = 0;
  let cost = 0;
  for (const slab of tariff.slabs) {
    const width = slab.upToKwh === null ? Infinity : slab.upToKwh - prevLimit;
    const take = Math.min(remaining, Math.max(0, width));
    cost += take * slab.rateInrPerKwh;
    remaining -= take;
    if (slab.upToKwh !== null) prevLimit = slab.upToKwh;
    if (remaining <= 0) break;
  }
  // Any energy beyond the last defined slab uses the last slab's rate.
  if (remaining > 0 && tariff.slabs.length > 0) {
    const last = tariff.slabs[tariff.slabs.length - 1];
    if (last) cost += remaining * last.rateInrPerKwh;
  }
  return cost;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
