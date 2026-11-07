import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { listAlerts, getAlert, acknowledgeAlert, resolveAlert } from '../db/repositories/alerts.js';
import { detectAlerts } from '../services/alerts.js';
import { parseOrThrow } from '../lib/validate.js';
import { getBuilding, getFloor, getCircuit } from '../db/repositories/hierarchy.js';
import { getRoom } from '../db/repositories/rooms.js';

const id = z.string().min(1).max(64);

export async function registerAlertsRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/alerts', async (req, reply) => {
    const q = parseOrThrow(z.object({
      siteId: id.optional(),
      buildingId: id.optional(),
      floorId: id.optional(),
      roomId: id.optional(),
      circuitId: id.optional(),
      deviceId: id.optional(),
      severity: z.enum(['low', 'medium', 'high']).optional(),
      status: z.enum(['active', 'acknowledged', 'resolved']).optional(),
      type: z.string().min(1).max(64).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }), req.query);
    const db = getDb();
    if (q.buildingId && !getBuilding(db, q.buildingId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown building: ${q.buildingId}`, requestId: req.id } });
    if (q.floorId && !getFloor(db, q.floorId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown floor: ${q.floorId}`, requestId: req.id } });
    if (q.roomId && !getRoom(db, q.roomId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown room: ${q.roomId}`, requestId: req.id } });
    if (q.circuitId && !getCircuit(db, q.circuitId)) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown circuit: ${q.circuitId}`, requestId: req.id } });
    const alerts = listAlerts(db, q);
    reply.send({ data: alerts, meta: { serverTime: new Date().toISOString(), total: alerts.length } });
  });

  app.get('/api/alerts/:alertId', async (req, reply) => {
    const p = parseOrThrow(z.object({ alertId: id }), req.params);
    const alert = getAlert(getDb(), p.alertId);
    return alert ? reply.send({ data: alert, meta: { serverTime: new Date().toISOString() } }) : reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown alert: ${p.alertId}`, requestId: req.id } });
  });

  app.post('/api/alerts/:alertId/acknowledge', async (req, reply) => {
    const p = parseOrThrow(z.object({ alertId: id }), req.params);
    const alert = acknowledgeAlert(getDb(), p.alertId);
    if (!alert) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown alert: ${p.alertId}`, requestId: req.id } });
    reply.send({ data: alert, meta: { serverTime: new Date().toISOString() } });
  });

  app.post('/api/alerts/:alertId/resolve', async (req, reply) => {
    const p = parseOrThrow(z.object({ alertId: id }), req.params);
    const alert = resolveAlert(getDb(), p.alertId);
    if (!alert) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown alert: ${p.alertId}`, requestId: req.id } });
    reply.send({ data: alert, meta: { serverTime: new Date().toISOString() } });
  });

  app.post('/api/alerts/detect', async (req, reply) => {
    const created = detectAlerts(getDb());
    reply.send({ data: created, meta: { serverTime: new Date().toISOString(), total: created.length } });
  });
}