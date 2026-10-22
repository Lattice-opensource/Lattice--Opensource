import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { timingSafeEqual } from 'node:crypto';
import { env, corsOrigins, isProduction, devEndpointsEnabled } from './config.js';
import { newRequestId } from './lib/errors.js';
import { registerHealthRoute } from './routes/health.js';
import { registerConfigRoute } from './routes/config.js';
import { registerSitesRoute } from './routes/sites.js';
import { registerRoomsRoute } from './routes/rooms.js';
import { registerDevicesRoute } from './routes/devices.js';
import { registerReadingsRoute } from './routes/readings.js';
import { registerDevRoute } from './routes/dev.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.x-api-key', 'req.headers.cookie'],
        remove: true,
      },
    },
    genReqId: () => newRequestId(),
    trustProxy: false,
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no Origin (curl, server-to-server).
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error('CORS origin not allowed'), false);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Optional shared API key guard (deployment convenience, NOT user auth).
  app.addHook('onRequest', async (req, reply) => {
    if (env.API_KEY && req.url.startsWith('/api/')) {
      const provided = req.headers['x-api-key'];
      const expected = env.API_KEY;
      // timing-safe compare
      const a = Buffer.from(String(provided ?? ''), 'utf8');
      const b = Buffer.from(expected, 'utf8');
      const ok = a.length === b.length && timingSafeEqual(a, b);
      if (!ok) {
        reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key', requestId: req.id } });
      }
    }
  });

  // Error handler: never leak stack traces or secrets.
  app.setErrorHandler((err, req, reply) => {
    const requestId = req.id;
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    const code =
      status === 400 ? 'INVALID_QUERY'
      : status === 404 ? 'NOT_FOUND'
      : status === 401 ? 'UNAUTHORIZED'
      : status === 429 ? 'RATE_LIMITED'
      : 'INTERNAL_ERROR';
    if (status >= 500) {
      req.log.error({ err, requestId }, 'request failed');
    }
    const errMessage = (err as { message?: string })?.message;
    const message = isProduction && status >= 500 ? 'Internal server error' : errMessage || 'Internal server error';
    reply.code(status).send({
      error: { code, message, requestId },
    });
  });

  // 404 handler
  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.url}`, requestId: req.id },
    });
  });

  await registerHealthRoute(app);
  await registerConfigRoute(app);
  await registerSitesRoute(app);
  await registerRoomsRoute(app);
  await registerDevicesRoute(app);
  await registerReadingsRoute(app);
  if (devEndpointsEnabled) {
    await registerDevRoute(app);
  }

  return app;
}
