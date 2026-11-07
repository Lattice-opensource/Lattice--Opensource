import { describe, it, expect } from 'vitest';
import { costForEnergy } from './services/cost.js';
import { freshnessStatus } from './lib/freshness.js';
import { siteTotalReadings } from './services/site-meter.js';

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

describe('site meter selection', () => {
  const meters = [
    { id: 'main', roomId: null, category: 'other' },
    { id: 'sub-a', roomId: 'room-a', category: 'lighting' },
    { id: 'sub-b', roomId: 'room-b', category: 'hvac' },
  ];

  it('uses a reporting main meter without double-counting sub-meters', () => {
    expect(siteTotalReadings(meters, [{ deviceId: 'main' }, { deviceId: 'sub-a' }])).toEqual([{ deviceId: 'main' }]);
  });

  it('falls back to all sub-meters when no main-meter reading exists', () => {
    expect(siteTotalReadings(meters, [{ deviceId: 'sub-a' }, { deviceId: 'sub-b' }])).toHaveLength(2);
  });

  it('returns no totals when no readings are available', () => {
    expect(siteTotalReadings(meters, [])).toEqual([]);
  });
});

describe('device freshness', () => {
  const now = Date.parse('2026-11-06T12:00:00.000Z');

  it('classifies recent, stale, and missing readings consistently', () => {
    expect(freshnessStatus('online', '2026-11-06T11:59:00.000Z', 300, now)).toBe('online');
    expect(freshnessStatus('online', '2026-11-06T11:54:00.000Z', 300, now)).toBe('stale');
    expect(freshnessStatus('online', null, 300, now)).toBe('unknown');
  });
});
