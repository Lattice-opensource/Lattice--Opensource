import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { getSite, getSiteTariffJson } from '../db/repositories/sites.js';
import { listDevices } from '../db/repositories/devices.js';
import { simulationEnabled, STALE_AFTER_SECONDS } from '../config.js';
import { parseOrThrow } from '../lib/validate.js';
import { APP_VERSION } from '../config.js';

const QuerySchema = z.object({
  siteId: z.string().min(1).max(64).default('site_home_01'),
});

export async function registerConfigRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/config', async (req, reply) => {
    const q = parseOrThrow(QuerySchema, req.query);
    const db = getDb();
    const site = getSite(db, q.siteId);
    if (!site) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown site: ${q.siteId}`, requestId: req.id } });
      return;
    }
    let tariff: unknown = null;
    const tj = getSiteTariffJson(db, q.siteId);
    if (tj) {
      try { tariff = JSON.parse(tj); } catch { tariff = null; }
    }
    if (!tariff) {
      tariff = { type: 'flat', unit: 'kWh', rateInrPerKwh: 6 };
    }
    const devices = listDevices(db, { siteId: q.siteId });
    const hasSimulated = devices.some((d) => d.isSimulated);
    const hasReal = devices.some((d) => !d.isSimulated);
    const mode = hasSimulated && hasReal ? 'mixed' : hasSimulated ? 'simulated' : 'live';
    const notice = hasSimulated
      ? 'All readings are SIMULATED development data. They are not real sensor measurements.'
      : 'Readings come from connected devices.';
    reply.send({
      data: {
        siteId: q.siteId,
        currency: site.currency,
        timezone: site.timezone,
        tariff,
        staleAfterSeconds: STALE_AFTER_SECONDS,
        dataSource: {
          mode,
          simulated: hasSimulated,
          notice,
        },
      },
      meta: { serverTime: new Date().toISOString() },
    });
    void APP_VERSION;
  });
}
