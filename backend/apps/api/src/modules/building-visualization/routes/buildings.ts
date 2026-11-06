import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../../../db/index.js';
import { listBuildings, getBuilding, createBuilding, updateBuilding, deleteBuilding } from '../repositories/buildings.js';
import { toIso } from '../../../lib/time.js';

const CreateSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1).max(120),
  address: z.string().max(240).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  floorCount: z.number().int().min(0).optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  address: z.string().max(240).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  floorCount: z.number().int().min(0).optional(),
});

export async function registerBuildingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/buildings', async (req, reply) => {
    const q = req.query as { siteId?: string; limit?: string; offset?: string };
    const db = getDb();
    const all = listBuildings(db, q.siteId);
    const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const slice = all.slice(offset, offset + limit);
    reply.send({ data: slice, meta: { serverTime: toIso(new Date()), total: all.length, limit, offset, hasMore: offset + slice.length < all.length } });
  });

  app.post('/api/buildings', async (req, reply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const db = getDb();
    const b = createBuilding(db, parsed.data);
    reply.code(201).send({ data: b, meta: { serverTime: toIso(new Date()) } });
  });

  app.get('/api/buildings/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const b = getBuilding(db, id);
    if (!b) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Building not found', requestId: req.id } });
      return;
    }
    reply.send({ data: b, meta: { serverTime: toIso(new Date()) } });
  });

  app.put('/api/buildings/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const db = getDb();
    const b = updateBuilding(db, id, parsed.data);
    if (!b) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Building not found', requestId: req.id } });
      return;
    }
    reply.send({ data: b, meta: { serverTime: toIso(new Date()) } });
  });

  app.delete('/api/buildings/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const ok = deleteBuilding(db, id);
    if (!ok) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Building not found', requestId: req.id } });
      return;
    }
    reply.code(204).send();
  });
}
