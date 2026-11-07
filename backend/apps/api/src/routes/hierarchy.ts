import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { getBuilding, getCircuit, getFloor, listBuildings, listCircuits, listFloors } from '../db/repositories/hierarchy.js';
import { getRoom } from '../db/repositories/rooms.js';
import { parseOrThrow } from '../lib/validate.js';

const id = z.string().min(1).max(64);
const notFound = (reply: any, req: any, kind: string, value: string) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown ${kind}: ${value}`, requestId: req.id } });

export async function registerHierarchyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/buildings', async (req, reply) => { const q = parseOrThrow(z.object({ siteId: id.optional() }), req.query); const rows = listBuildings(getDb(), q.siteId); reply.send({ data: rows, meta: { serverTime: new Date().toISOString(), total: rows.length } }); });
  app.get('/api/buildings/:buildingId', async (req, reply) => { const p = parseOrThrow(z.object({ buildingId: id }), req.params); const row = getBuilding(getDb(), p.buildingId); return row ? reply.send({ data: row, meta: { serverTime: new Date().toISOString() } }) : notFound(reply, req, 'building', p.buildingId); });
  app.get('/api/floors', async (req, reply) => { const q = parseOrThrow(z.object({ buildingId: id.optional() }), req.query); const db = getDb(); if (q.buildingId && !getBuilding(db, q.buildingId)) return notFound(reply, req, 'building', q.buildingId); const rows = listFloors(db, q.buildingId); reply.send({ data: rows, meta: { serverTime: new Date().toISOString(), total: rows.length } }); });
  app.get('/api/floors/:floorId', async (req, reply) => { const p = parseOrThrow(z.object({ floorId: id }), req.params); const row = getFloor(getDb(), p.floorId); return row ? reply.send({ data: row, meta: { serverTime: new Date().toISOString() } }) : notFound(reply, req, 'floor', p.floorId); });
  app.get('/api/circuits', async (req, reply) => { const q = parseOrThrow(z.object({ siteId: id.optional(), buildingId: id.optional(), floorId: id.optional(), roomId: id.optional() }), req.query); const db = getDb(); if (q.buildingId && !getBuilding(db, q.buildingId)) return notFound(reply, req, 'building', q.buildingId); if (q.floorId && !getFloor(db, q.floorId)) return notFound(reply, req, 'floor', q.floorId); if (q.roomId && !getRoom(db, q.roomId)) return notFound(reply, req, 'room', q.roomId); const rows = listCircuits(db, q); reply.send({ data: rows, meta: { serverTime: new Date().toISOString(), total: rows.length } }); });
  app.get('/api/circuits/:circuitId', async (req, reply) => { const p = parseOrThrow(z.object({ circuitId: id }), req.params); const row = getCircuit(getDb(), p.circuitId); return row ? reply.send({ data: row, meta: { serverTime: new Date().toISOString() } }) : notFound(reply, req, 'circuit', p.circuitId); });
}
