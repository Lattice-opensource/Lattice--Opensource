import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { generateReport } from '../services/reports.js';
import { parseOrThrow } from '../lib/validate.js';
import { getBuilding, getFloor, getCircuit } from '../db/repositories/hierarchy.js';
import { getRoom } from '../db/repositories/rooms.js';

const id = z.string().min(1).max(64);

export async function registerReportsRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/reports', async (req, reply) => {
    const q = parseOrThrow(z.object({
      siteId: id.optional(),
      buildingId: id.optional(),
      floorId: id.optional(),
      roomId: id.optional(),
      circuitId: id.optional(),
      period: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
      from: z.string().optional(),
      to: z.string().optional(),
      compare: z.coerce.boolean().optional(),
    }), req.query);
    const db = getDb();
    if (q.buildingId && !getBuilding(db, q.buildingId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown building: ${q.buildingId}`, requestId: req.id } });
    if (q.floorId && !getFloor(db, q.floorId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown floor: ${q.floorId}`, requestId: req.id } });
    if (q.roomId && !getRoom(db, q.roomId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown room: ${q.roomId}`, requestId: req.id } });
    if (q.circuitId && !getCircuit(db, q.circuitId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown circuit: ${q.circuitId}`, requestId: req.id } });
    if (q.period === 'custom' && (!q.from || !q.to)) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Custom period requires from and to', requestId: req.id } });
    const report = generateReport(db, {
      siteId: q.siteId,
      buildingId: q.buildingId,
      floorId: q.floorId,
      roomId: q.roomId,
      circuitId: q.circuitId,
      period: q.period,
      from: q.from,
      to: q.to,
      compare: q.compare,
    });
    reply.send({ data: report, meta: { serverTime: new Date().toISOString() } });
  });

  app.get('/api/reports/export', async (req, reply) => {
    const q = parseOrThrow(z.object({
      siteId: id.optional(),
      buildingId: id.optional(),
      floorId: id.optional(),
      roomId: id.optional(),
      circuitId: id.optional(),
      period: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
      from: z.string().optional(),
      to: z.string().optional(),
      format: z.enum(['csv']).default('csv'),
    }), req.query);
    const db = getDb();
    if (q.buildingId && !getBuilding(db, q.buildingId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown building: ${q.buildingId}`, requestId: req.id } });
    if (q.floorId && !getFloor(db, q.floorId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown floor: ${q.floorId}`, requestId: req.id } });
    if (q.roomId && !getRoom(db, q.roomId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown room: ${q.roomId}`, requestId: req.id } });
    if (q.circuitId && !getCircuit(db, q.circuitId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown circuit: ${q.circuitId}`, requestId: req.id } });
    if (q.period === 'custom' && (!q.from || !q.to)) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Custom period requires from and to', requestId: req.id } });
    const report = generateReport(db, {
      siteId: q.siteId,
      buildingId: q.buildingId,
      floorId: q.floorId,
      roomId: q.roomId,
      circuitId: q.circuitId,
      period: q.period,
      from: q.from,
      to: q.to,
      compare: false,
    });
    const lines: string[] = [];
    lines.push('timestamp,powerWAvg,powerWMax,energyKwh,costInr,sampleCount');
    for (const p of report.series) {
      lines.push(`${p.bucketStart},${p.powerWAvg},${p.powerWMax},${p.energyKwh},${p.costInr},${p.sampleCount}`);
    }
    const csv = lines.join('\n');
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="lattice-report.csv"');
    reply.send(csv);
  });
}