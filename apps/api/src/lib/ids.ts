import { randomUUID } from 'node:crypto';

/** Generate a short, URL-safe id with a given prefix. */
export function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/** Generate a reading id. */
export function readingId(): string {
  return makeId('r');
}

/** Generate a device id. */
export function deviceId(): string {
  return makeId('dev');
}

/** Generate a room id. */
export function roomId(): string {
  return makeId('room');
}
