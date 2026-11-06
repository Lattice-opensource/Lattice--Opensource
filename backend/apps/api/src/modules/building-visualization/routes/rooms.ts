import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../../../db/index.js';
import { getRoom } from '../../../db/repositories/rooms.js';
import { updateRoomMapping, listRoomsByFloor } from '../repositories/rooms.js';
import { toIso } from '../../../lib/time.js';

const UpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  roomType: z.string().max(60).optional().nullable(),
  areaSqm: z.number().min(0).optional().nullable(),
  x: z.number().min(0).max(1).optional().nullable(),
  y: z.number().min(0).max(1).optional().nullable(),
  width: z.number().min(0).max(1).optional().nullable(),
  height: z.number().min(0).max(1).optional().nullable(),
  boundary: z.string().optional().nullable(),
  buildingId: z.string().min(1).optional().nullable(),
  floorId: z.string().min(1).optional().nullable(),
  circuitId: z.string().min(1).optional().nullable(),
});

export async function registerRoomRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/floors/:floorId/rooms', async (req, reply) => {
    const floorId = (req.params as { floorId: string }).floorId;
    const db = getDb();
    const rooms = listRoomsByFloor(db, floorId);
    reply.send({ data: rooms, meta: { serverTime: toIso(new Date()), total: rooms.length } });
  });

  app.put('/api/rooms/:id/mapping', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const cur = getRoom(db, id);
    if (!cur) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Room not found', requestId: req.id } });
      return;
    }
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const updated = updateRoomMapping(db, id, parsed.data as any);
    if (parsed.data.name) {
      db.prepare('UPDATE rooms SET name = ?, updated_at = ? WHERE id = ?').run(parsed.data.name, toIso(new Date()), id);
    }
    reply.send({ data: updated, meta: { serverTime: toIso(new Date()) } });
  });

  app.delete('/api/rooms/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const res = db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    if (Number(res.changes ?? 0) === 0) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Room not found', requestId: req.id } });
      return;
    }
    reply.code(204).send();
  });
}
