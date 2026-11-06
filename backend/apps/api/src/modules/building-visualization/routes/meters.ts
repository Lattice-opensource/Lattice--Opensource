import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../../../db/index.js';
import { listMeters, getMeter, createMeter, deleteMeter } from '../repositories/meters.js';
import { toIso } from '../../../lib/time.js';

const CreateSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(60).default('electricity'),
  unit: z.string().min(1).max(20).default('kWh'),
  dataSource: z.string().max(120).optional().nullable(),
});

export async function registerMeterRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/meters', async (req, reply) => {
    const q = req.query as { siteId?: string; limit?: string; offset?: string };
    const db = getDb();
    const all = listMeters(db, q.siteId);
    const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const slice = all.slice(offset, offset + limit);
    reply.send({ data: slice, meta: { serverTime: toIso(new Date()), total: all.length, limit, offset, hasMore: offset + slice.length < all.length } });
  });

  app.post('/api/meters', async (req, reply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const db = getDb();
    const m = createMeter(db, parsed.data);
    reply.code(201).send({ data: m, meta: { serverTime: toIso(new Date()) } });
  });

  app.get('/api/meters/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const m = getMeter(db, id);
    if (!m) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Meter not found', requestId: req.id } });
      return;
    }
    reply.send({ data: m, meta: { serverTime: toIso(new Date()) } });
  });

  app.delete('/api/meters/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const ok = deleteMeter(db, id);
    if (!ok) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Meter not found', requestId: req.id } });
      return;
    }
    reply.code(204).send();
  });
}
