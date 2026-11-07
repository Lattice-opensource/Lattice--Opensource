interface MeterDevice {
  id: string;
  roomId: string | null;
  category: string;
}

interface MeterReading {
  deviceId: string;
}

/** Uses main-meter readings when present; otherwise preserves all available sub-meter readings. */
export function siteTotalReadings<T extends MeterReading>(devices: MeterDevice[], readings: T[]): T[] {
  const meterIds = new Set(devices.filter((d) => d.roomId === null && d.category === 'other').map((d) => d.id));
  return readings.some((r) => meterIds.has(r.deviceId))
    ? readings.filter((r) => meterIds.has(r.deviceId))
    : readings;
}
