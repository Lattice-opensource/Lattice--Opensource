import type { DeviceStatus } from '@lattice/contracts';

export function freshnessStatus(
  status: DeviceStatus,
  lastSeenAt: string | null,
  staleAfterSeconds: number,
  nowMs: number = Date.now(),
): DeviceStatus {
  if (status !== 'online') return status;
  if (!lastSeenAt) return 'unknown';
  const seenMs = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seenMs) || nowMs - seenMs > staleAfterSeconds * 1000) return 'stale';
  return 'online';
}
