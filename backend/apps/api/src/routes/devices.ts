import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { listDevices, getDevice } from '../db/repositories/devices.js';
import { parseOrThrow } from '../lib/validate.js';
import { STALE_AFTER_SECONDS } from '../config.js';
import { freshnessStatus } from '../lib/freshness.js';
import { getBuilding, getFloor, getCircuit } from '../db/repositories/hierarchy.js';

const ListQuery = z.object({
  siteId: z.string().min(1).max(64).optional(),
  buildingId: z.string().min(1).max(64).optional(),
  floorId: z.string().min(1).max(64).optional(),
  roomId: z.string().min(1).max(64).optional(),
  circuitId: z.string().min(1).max(64).optional(),
});

function applyStale<T extends { status: string; lastSeenAt: string | null }>(d: T): T {
  return { ...d, status: freshnessStatus(d.status as import('@lattice/contracts').DeviceStatus, d.lastSeenAt, STALE_AFTER_SECONDS) };
}

export async function registerDevicesRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/devices', async (req, reply) => {
    const q = parseOrThrow(ListQuery, req.query);
    const db = getDb();
    if (q.buildingId && !getBuilding(db, q.buildingId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown building: ${q.buildingId}`, requestId: req.id } });
    if (q.floorId && !getFloor(db, q.floorId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown floor: ${q.floorId}`, requestId: req.id } });
    if (q.circuitId && !getCircuit(db, q.circuitId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown circuit: ${q.circuitId}`, requestId: req.id } });
    const devices = listDevices(db, q).map(applyStale);
    reply.send({
      data: devices,
      meta: { serverTime: new Date().toISOString(), total: devices.length },
    });
  });

  app.get('/api/devices/:deviceId', async (req, reply) => {
    const Params = z.object({ deviceId: z.string().min(1).max(64) });
    const p = parseOrThrow(Params, req.params);
    const db = getDb();
    const device = getDevice(db, p.deviceId);
    if (!device) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown device: ${p.deviceId}`, requestId: req.id } });
      return;
    }
    reply.send({ data: applyStale(device), meta: { serverTime: new Date().toISOString() } });
  });
}
