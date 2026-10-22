/** Format a Date as a fixed-width ISO-8601 UTC string with millisecond precision. */
export function toIso(d: Date): string {
  return d.toISOString();
}

/** Parse an ISO string to a Date, returning null on failure. */
export function parseIso(s: string): Date | null {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Round a number to N decimal places. */
export function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Add seconds to a Date and return a new Date. */
export function addSeconds(d: Date, seconds: number): Date {
  return new Date(d.getTime() + seconds * 1000);
}
