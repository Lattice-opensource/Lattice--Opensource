import { z } from 'zod';
import { badRequest } from './errors.js';

/**
 * Parse `value` with `schema`, throwing a 400 ApiError with field-level details on
 * failure. Returns the parsed (and coerced) value on success.
 */
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
  source = 'request',
): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.') || source,
      message: i.message,
    }));
    throw badRequest('Invalid request', details);
  }
  return result.data as z.infer<T>;
}

/**
 * Build a Zod schema for a query object where every field is optional, and coerce
 * common query types. Convenience wrapper kept minimal.
 */
export function queryString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}
