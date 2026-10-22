import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { listSites, getSite } from '../db/repositories/sites.js';
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
