import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../../../db/index.js';
import { listCircuits, getCircuit, createCircuit, deleteCircuit } from '../repositories/circuits.js';
import { toIso } from '../../../lib/time.js';

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  floorId: z.string().min(1).optional().nullable(),
  meterId: z.string().min(1).optional().nullable(),
});

export async function registerCircuitRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/circuits', async (req, reply) => {
    const db = getDb();
    const list = listCircuits(db);
    reply.send({ data: list, meta: { serverTime: toIso(new Date()), total: list.length } });
  });

  app.post('/api/circuits', async (req, reply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const db = getDb();
    const c = createCircuit(db, parsed.data);
    reply.code(201).send({ data: c, meta: { serverTime: toIso(new Date()) } });
  });

  app.get('/api/circuits/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const c = getCircuit(db, id);
    if (!c) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Circuit not found', requestId: req.id } });
      return;
    }
    reply.send({ data: c, meta: { serverTime: toIso(new Date()) } });
  });

  app.delete('/api/circuits/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const ok = deleteCircuit(db, id);
    if (!ok) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Circuit not found', requestId: req.id } });
      return;
    }
    reply.code(204).send();
  });
}
