import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { listReadings, latestPerDevice } from '../db/repositories/readings.js';
import { parseOrThrow } from '../lib/validate.js';
import { computeSummary } from '../services/summary.js';
import { aggregate, resolveTariff } from '../services/aggregate.js';

const ReadingsQuery = z.object({
  deviceId: z.string().min(1).max(64).optional(),
  roomId: z.string().min(1).max(64).optional(),
  siteId: z.string().min(1).max(64).optional(),
  from: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'invalid ISO-8601 timestamp').optional(),
  to: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'invalid ISO-8601 timestamp').optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
  offset: z.coerce.number().int().min(0).default(0),
  order: z.enum(['asc', 'desc']).default('asc'),
});



export async function registerReadingsRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/readings', async (req, reply) => {
    const q = parseOrThrow(ReadingsQuery, req.query);
    const db = getDb();
    const { rows, total } = listReadings(db, {
      deviceId: q.deviceId,
      roomId: q.roomId,
      siteId: q.siteId,
      from: q.from,
      to: q.to,
      limit: q.limit,
      offset: q.offset,
      order: q.order,
    });
    const hasMore = q.offset + rows.length < total;
    reply.send({
      data: rows,
      meta: {
        serverTime: new Date().toISOString(),
        total,
        limit: q.limit,
        offset: q.offset,
        hasMore,
      },
    });
  });

  app.get('/api/readings/latest', async (req, reply) => {
    const q = parseOrThrow(
      z.object({
        siteId: z.string().min(1).max(64).optional(),
        deviceId: z.string().min(1).max(64).optional(),
        limit: z.coerce.number().int().min(1).max(500).optional(),
      }),
      req.query,
    );
    const db = getDb();
    const internal = latestPerDevice(db, q);
    const serverTime = new Date().toISOString();
    const limit = q.limit ?? internal.length;
    const sliced = internal.slice(0, limit);
    const readings = sliced.map((r) => ({
      deviceId: r.deviceId,
      timestamp: r.timestamp,
      powerWatts: r.powerW,
      energyKwh: r.energyKwh ?? 0,
      source: (r.isSimulated ? 'simulated' : 'real') as 'simulated' | 'real',
      // additive (richer) fields:
      id: r.id,
      intervalStart: r.intervalStart,
      intervalSeconds: r.intervalSeconds,
      energyKwhTotal: r.energyKwhTotal,
      voltageV: r.voltageV,
      currentA: r.currentA,
      isSimulated: r.isSimulated,
    }));
    reply.send({
      readings,
      count: readings.length,
      generatedAt: serverTime,
      // additive legacy shape:
      data: internal,
      meta: { serverTime, total: internal.length },
    });
  });

  app.get('/api/readings/summary', async (req, reply) => {
    const q = parseOrThrow(
      z.object({
        siteId: z.string().min(1).max(64).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
      req.query,
    );
    const db = getDb();
    const now = new Date();
    const from = q.from ?? new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const to = q.to ?? now.toISOString();
    if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
      reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid from/to timestamp', requestId: req.id } });
      return;
    }
    const summary = computeSummary(db, { siteId: q.siteId, from, to });
    reply.send({ data: summary, meta: { serverTime: new Date().toISOString() } });
  });

  app.get('/api/readings/aggregate', async (req, reply) => {
    const q = parseOrThrow(
      z.object({
        siteId: z.string().min(1).max(64).optional(),
        roomId: z.string().min(1).max(64).optional(),
        deviceId: z.string().min(1).max(64).optional(),
        from: z.string(),
        to: z.string(),
        bucket: z.enum(['15m', 'hour', 'day', 'week']).default('hour'),
        groupBy: z.enum(['device', 'room', 'site']).default('device'),
      }),
      req.query,
    );
    if (Number.isNaN(Date.parse(q.from)) || Number.isNaN(Date.parse(q.to))) {
      reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid from/to timestamp', requestId: req.id } });
      return;
    }
    const db = getDb();
    const siteId = q.siteId ?? 'site_home_01';
    const tariff = resolveTariff(db, siteId);
    const points = aggregate(db, {
      siteId: q.siteId,
      roomId: q.roomId,
      deviceId: q.deviceId,
      from: q.from,
      to: q.to,
      bucket: q.bucket,
      groupBy: q.groupBy,
      tariff,
    });
    reply.send({
      data: points,
      meta: { serverTime: new Date().toISOString(), total: points.length },
    });
  });
}
