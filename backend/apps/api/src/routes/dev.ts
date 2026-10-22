import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';
import { parseOrThrow } from '../lib/validate.js';

export async function registerDevRoute(app: FastifyInstance): Promise<void> {
  app.post('/api/dev/seed', async (req, reply) => {
    const Body = z.object({ force: z.boolean().default(false) });
    const b = parseOrThrow(Body, req.body ?? {});
    const db = getDb();
    const res = seedDatabase(db, { force: b.force });
    reply.send({ data: res, meta: { serverTime: new Date().toISOString() } });
  });

  app.post('/api/dev/reset', async (req, reply) => {
    const db = getDb();
    const res = seedDatabase(db, { force: true });
    reply.send({ data: res, meta: { serverTime: new Date().toISOString() } });
  });
}
