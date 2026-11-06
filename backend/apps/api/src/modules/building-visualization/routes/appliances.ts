import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../../../db/index.js';
import { createAppliance, getAppliance, listAppliances, updateAppliance, deleteAppliance, updateApplianceStatus } from '../repositories/appliances.js';
import { toIso } from '../../../lib/time.js';

const MONITORING_METHODS = ['none', 'device', 'circuit', 'room', 'smart_plug', 'manual', 'estimated'] as const;
const APPLIANCE_STATUSES = ['unknown', 'online', 'offline', 'stale'] as const;
const APPLIANCE_TYPES = ['air_conditioner', 'refrigerator', 'lighting', 'television', 'computer', 'water_heater', 'washing_machine', 'kitchen_equipment', 'other'] as const;

const CreateSchema = z.object({
  roomId: z.string().min(1).optional().nullable(),
  circuitId: z.string().min(1).optional().nullable(),
  deviceId: z.string().min(1).optional().nullable(),
  name: z.string().min(1).max(120),
  type: z.enum(APPLIANCE_TYPES).default('other'),
  manufacturer: z.string().min(1).max(120).optional().nullable(),
  model: z.string().min(1).max(120).optional().nullable(),
  ratedPowerW: z.number().min(0).optional().nullable(),
  monitoringMethod: z.enum(MONITORING_METHODS).default('none'),
  status: z.enum(APPLIANCE_STATUSES).default('unknown'),
  positionX: z.number().min(0).max(1).optional().nullable(),
  positionY: z.number().min(0).max(1).optional().nullable(),
});

const UpdateSchema = CreateSchema.partial();

export async function registerApplianceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/rooms/:roomId/appliances', async (req, reply) => {
    const roomId = (req.params as { roomId: string }).roomId;
    const db = getDb();
    const list = listAppliances(db, roomId);
    reply.send({ data: list, meta: { serverTime: toIso(new Date()), total: list.length } });
  });

  app.get('/api/appliances/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const a = getAppliance(db, id);
    if (!a) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Appliance not found', requestId: req.id } });
      return;
    }
    reply.send({ data: a, meta: { serverTime: toIso(new Date()) } });
  });

  app.post('/api/appliances', async (req, reply) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const db = getDb();
    const a = createAppliance(db, {
      roomId: parsed.data.roomId ?? null,
      circuitId: parsed.data.circuitId ?? null,
      deviceId: parsed.data.deviceId ?? null,
      name: parsed.data.name,
      type: parsed.data.type,
      manufacturer: parsed.data.manufacturer ?? null,
      model: parsed.data.model ?? null,
      ratedPowerW: parsed.data.ratedPowerW ?? null,
      monitoringMethod: parsed.data.monitoringMethod,
      status: parsed.data.status,
      positionX: parsed.data.positionX ?? null,
      positionY: parsed.data.positionY ?? null,
    });
    reply.code(201).send({ data: a, meta: { serverTime: toIso(new Date()) } });
  });

  app.put('/api/appliances/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Invalid request', details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })), requestId: req.id } });
      return;
    }
    const db = getDb();
    const a = updateAppliance(db, id, {
      roomId: parsed.data.roomId,
      circuitId: parsed.data.circuitId,
      deviceId: parsed.data.deviceId,
      name: parsed.data.name,
      type: parsed.data.type,
      manufacturer: parsed.data.manufacturer,
      model: parsed.data.model,
      ratedPowerW: parsed.data.ratedPowerW,
      monitoringMethod: parsed.data.monitoringMethod,
      status: parsed.data.status,
      positionX: parsed.data.positionX,
      positionY: parsed.data.positionY,
    });
    if (!a) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Appliance not found', requestId: req.id } });
      return;
    }
    reply.send({ data: a, meta: { serverTime: toIso(new Date()) } });
  });

  app.delete('/api/appliances/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const ok = deleteAppliance(db, id);
    if (!ok) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Appliance not found', requestId: req.id } });
      return;
    }
    reply.code(204).send();
  });
}
