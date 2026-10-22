import { describe, it, expect } from 'vitest';
import { costForEnergy } from './services/cost.js';

describe('costForEnergy', () => {
  it('flat tariff', () => {
    expect(costForEnergy({ type: 'flat', unit: 'kWh', rateInrPerKwh: 5 }, 10)).toBe(50);
  });

  it('slab tariff first slab', () => {
    const t = { type: 'slab' as const, unit: 'kWh' as const, slabs: [
      { upToKwh: 100, rateInrPerKwh: 2.5 },
      { upToKwh: 400, rateInrPerKwh: 5.5 },
      { upToKwh: null, rateInrPerKwh: 7.5 },
    ]};
    expect(costForEnergy(t, 50)).toBeCloseTo(125, 5);
  });

  it('slab tariff crossing slabs', () => {
    const t = { type: 'slab' as const, unit: 'kWh' as const, slabs: [
      { upToKwh: 100, rateInrPerKwh: 2.5 },
      { upToKwh: 400, rateInrPerKwh: 5.5 },
      { upToKwh: null, rateInrPerKwh: 7.5 },
    ]};
    // 100*2.5 + 50*5.5 = 250 + 275 = 525
    expect(costForEnergy(t, 150)).toBeCloseTo(525, 5);
  });

  it('zero energy', () => {
    expect(costForEnergy({ type: 'flat', unit: 'kWh', rateInrPerKwh: 5 }, 0)).toBe(0);
    expect(costForEnergy({ type: 'flat', unit: 'kWh', rateInrPerKwh: 5 }, -3)).toBe(0);
  });
});
