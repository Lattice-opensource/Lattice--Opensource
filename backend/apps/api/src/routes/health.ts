import type { FastifyInstance } from 'fastify';
import { getDb, isDbOpen } from '../db/index.js';
import { APP_VERSION } from '../config.js';

export async function registerHealthRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async (req, reply) => {
    const start = Date.now();
    let dbStatus: 'up' | 'down' = 'down';
    try {
      if (isDbOpen()) {
        getDb().prepare('SELECT 1').get();
        dbStatus = 'up';
      }
    } catch {
      dbStatus = 'down';
    }
    const status = dbStatus === 'up' ? 'ok' : 'degraded';
    const nowIso = new Date().toISOString();
    reply.code(dbStatus === 'up' ? 200 : 503).send({
      status,
      timestamp: nowIso,
      service: 'lattice-backend',
      version: APP_VERSION,
      uptimeSeconds: process.uptime(),
      time: nowIso,
      database: dbStatus,
    });
    void start;
    void req;
  });
}
