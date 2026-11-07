import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { listRooms, getRoom } from '../db/repositories/rooms.js';
import { parseOrThrow } from '../lib/validate.js';
import { getBuilding, getFloor } from '../db/repositories/hierarchy.js';

const ListQuery = z.object({
  siteId: z.string().min(1).max(64).optional(),
  buildingId: z.string().min(1).max(64).optional(),
  floorId: z.string().min(1).max(64).optional(),
});

export async function registerRoomsRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/rooms', async (req, reply) => {
    const q = parseOrThrow(ListQuery, req.query);
    const db = getDb();
    if (q.buildingId && !getBuilding(db, q.buildingId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown building: ${q.buildingId}`, requestId: req.id } });
    if (q.floorId && !getFloor(db, q.floorId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown floor: ${q.floorId}`, requestId: req.id } });
    const rooms = listRooms(db, q);
    reply.send({
      data: rooms,
      meta: { serverTime: new Date().toISOString(), total: rooms.length },
    });
  });

  app.get('/api/rooms/:roomId', async (req, reply) => {
    const Params = z.object({ roomId: z.string().min(1).max(64) });
    const p = parseOrThrow(Params, req.params);
    const db = getDb();
    const room = getRoom(db, p.roomId);
    if (!room) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown room: ${p.roomId}`, requestId: req.id } });
      return;
    }
    reply.send({ data: room, meta: { serverTime: new Date().toISOString() } });
  });
}
