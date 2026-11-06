import type { FastifyInstance } from 'fastify';
import { getDb } from '../../../db/index.js';
import { fetchBuildingAlerts } from '../services/alertProxy.js';
import { toIso } from '../../../lib/time.js';

export async function registerBuildingAlertRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/buildings/:id/alerts', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    // verify building exists
    const b = db.prepare('SELECT id FROM buildings WHERE id = ?').get(id);
    if (!b) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Building not found', requestId: req.id } });
      return;
    }
    const result = await fetchBuildingAlerts(id);
    if (!result.available) {
      reply.code(200).send({ data: [], meta: { serverTime: toIso(new Date()), available: false, error: result.error } });
      return;
    }
    reply.send({ data: result.alerts, meta: { serverTime: toIso(new Date()), total: result.alerts.length, available: true } });
  });
}
