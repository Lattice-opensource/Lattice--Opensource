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

/** Start of "today" (00:00) in the given IANA timezone, as a UTC ISO string. */
export function startOfDayInTz(tz: string, now: Date = new Date()): string {
  const off = tzOffsetMinutes(tz, now);
  const localMs = now.getTime() + off * 60000;
  const local = new Date(localMs);
  const y = local.getUTCFullYear();
  const mo = local.getUTCMonth();
  const da = local.getUTCDate();
  const localMidnight = Date.UTC(y, mo, da, 0, 0, 0, 0);
  const utcMidnight = localMidnight - off * 60000;
  return new Date(utcMidnight).toISOString();
}

function tzOffsetMinutes(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
  const parts = dtf.formatToParts(date);
  const off = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = off.match(/GMT([+-])(\\d{1,2})(?::(\\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hh = parseInt(m[2] ?? '0', 10);
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hh * 60 + mm);
}
