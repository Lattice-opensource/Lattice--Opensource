import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../../../db/index.js';
import { insertEnergyReading, listEnergyReadings } from '../repositories/energy-readings.js';
import { aggregateBuilding, aggregateRoom, aggregateAppliance, historicalTrend } from '../services/energyAggregator.js';
import { toIso } from '../../../lib/time.js';

const EntityTypeEnum = z.enum(['building', 'floor', 'room', 'circuit', 'meter', 'appliance', 'device']);
const SourceEnum = z.enum(['measured', 'estimated', 'simulated']);

const CreateSchema = z.object({
  entityType: EntityTypeEnum,
  entityId: z.string().min(1),
  timestamp: z.string().optional(),
  powerW: z.number().min(0).optional().nullable(),
  energyKwh: z.number().min(0).optional().nullable(),
  measurementSource: SourceEnum.default('measured'),
  isSimulated: z.boolean().default(false),
});

export async function registerEnergyRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/energy-readings', async (req, reply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const db = getDb();
    const ts = parsed.data.timestamp || new Date().toISOString();
    const r = insertEnergyReading(db, {
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      timestamp: ts,
      powerW: parsed.data.powerW ?? null,
      energyKwh: parsed.data.energyKwh ?? null,
      measurementSource: parsed.data.measurementSource,
      isSimulated: parsed.data.isSimulated,
    });
    reply.code(201).send({ data: r, meta: { serverTime: toIso(new Date()) } });
  });

  app.get('/api/energy-readings', async (req, reply) => {
    const q = req.query as { entityType?: string; entityId?: string; from?: string; to?: string; limit?: string };
    const db = getDb();
    const list = listEnergyReadings(db, {
      entityType: q.entityType as any,
      entityId: q.entityId,
      from: q.from,
      to: q.to,
      limit: q.limit ? Number(q.limit) : 1000,
    });
    reply.send({ data: list, meta: { serverTime: toIso(new Date()), total: list.length } });
  });

  app.get('/api/buildings/:id/energy', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const q = req.query as { from?: string; to?: string };
    const db = getDb();
    const now = new Date();
    const from = q.from || new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const to = q.to || now.toISOString();
    const agg = aggregateBuilding(db, id, from, to);
    reply.send({ data: { buildingId: id, window: { from, to }, ...agg }, meta: { serverTime: toIso(now) } });
  });

  app.get('/api/rooms/:id/energy', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const q = req.query as { from?: string; to?: string };
    const db = getDb();
    const now = new Date();
    const from = q.from || new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const to = q.to || now.toISOString();
    const agg = aggregateRoom(db, id, from, to);
    reply.send({ data: { roomId: id, window: { from, to }, ...agg }, meta: { serverTime: toIso(now) } });
  });

  app.get('/api/appliances/:id/energy', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const q = req.query as { from?: string; to?: string };
    const db = getDb();
    const now = new Date();
    const from = q.from || new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const to = q.to || now.toISOString();
    const res = aggregateAppliance(db, id, from, to);
    reply.send({ data: { applianceId: id, window: { from, to }, ...res }, meta: { serverTime: toIso(now) } });
  });
}
