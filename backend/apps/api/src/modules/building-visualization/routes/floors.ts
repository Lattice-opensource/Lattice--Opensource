import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../../../db/index.js';
import { listFloors, getFloor, createFloor, deleteFloor } from '../repositories/floors.js';
import { getBuilding } from '../repositories/buildings.js';
import { toIso } from '../../../lib/time.js';

const CreateSchema = z.object({
  level: z.number().int(),
  name: z.string().min(1).max(120),
  blueprintRef: z.string().optional().nullable(),
});

const UpdateSchema = z.object({
  level: z.number().int().optional(),
  name: z.string().min(1).max(120).optional(),
  blueprintRef: z.string().optional().nullable(),
});

export async function registerFloorRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/buildings/:buildingId/floors', async (req, reply) => {
    const buildingId = (req.params as { buildingId: string }).buildingId;
    const db = getDb();
    if (!getBuilding(db, buildingId)) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Building not found', requestId: req.id } });
      return;
    }
    const floors = listFloors(db, buildingId);
    reply.send({ data: floors, meta: { serverTime: toIso(new Date()), total: floors.length } });
  });

  app.post('/api/buildings/:buildingId/floors', async (req, reply) => {
    const buildingId = (req.params as { buildingId: string }).buildingId;
    const db = getDb();
    if (!getBuilding(db, buildingId)) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Building not found', requestId: req.id } });
      return;
    }
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const f = createFloor(db, { buildingId, ...parsed.data });
    reply.code(201).send({ data: f, meta: { serverTime: toIso(new Date()) } });
  });

  app.get('/api/floors/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const f = getFloor(db, id);
    if (!f) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Floor not found', requestId: req.id } });
      return;
    }
    reply.send({ data: f, meta: { serverTime: toIso(new Date()) } });
  });

  app.put('/api/floors/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const cur = getFloor(db, id);
    if (!cur) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Floor not found', requestId: req.id } });
      return;
    }
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const now = toIso(new Date());
    const updated = { ...cur, ...parsed.data };
    db.prepare('UPDATE floors SET level=?, name=?, blueprint_ref=?, updated_at=? WHERE id=?')
      .run(updated.level, updated.name, updated.blueprintRef ?? null, now, id);
    reply.send({ data: getFloor(db, id), meta: { serverTime: toIso(new Date()) } });
  });

  app.delete('/api/floors/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const ok = deleteFloor(db, id);
    if (!ok) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Floor not found', requestId: req.id } });
      return;
    }
    reply.code(204).send();
  });
}
