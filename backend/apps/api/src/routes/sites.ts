import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { listSites, getSite } from '../db/repositories/sites.js';
import { computeSummary } from '../services/summary.js';
import { round2 } from '../services/cost.js';
import { parseOrThrow } from '../lib/validate.js';

export async function registerSitesRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/sites', async (req, reply) => {
    const db = getDb();
    const sites = listSites(db);
    reply.send({
      data: sites,
      meta: { serverTime: new Date().toISOString(), total: sites.length },
    });
  });

  app.get('/api/sites/summary', async (req, reply) => {
    const db = getDb();
    const sites = listSites(db);
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const to = now.toISOString();
    const summaries = sites.map((s) => {
      const summary = computeSummary(db, { siteId: s.id, from, to });
      return {
        siteId: s.id,
        name: s.name,
        currentPowerKw: round2(summary.totals.powerW / 1000),
        todayEnergyKwh: summary.totals.energyKwh,
        todayCostInr: summary.totals.costInr,
      };
    });
    reply.send({ data: summaries, meta: { serverTime: now.toISOString(), total: summaries.length } });
  });

  app.get('/api/sites/:siteId', async (req, reply) => {
    const Params = z.object({ siteId: z.string().min(1).max(64) });
    const p = parseOrThrow(Params, req.params);
    const db = getDb();
    const site = getSite(db, p.siteId);
    if (!site) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: `Unknown site: ${p.siteId}`, requestId: req.id } });
      return;
    }
    reply.send({ data: site, meta: { serverTime: new Date().toISOString() } });
  });
}
