import type { FastifyInstance } from 'fastify';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../../../db/index.js';
import { createBlueprint, deleteBlueprint, listBlueprints } from '../repositories/blueprints.js';
import { getFloor } from '../repositories/floors.js';
import { parseMultipart } from '../../../lib/multipart.js';
import { VISUALIZATION_CONFIG } from '../config/index.js';
import { toIso } from '../../../lib/time.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'data', 'blueprints');

function ensureStorage() { mkdirSync(STORAGE_ROOT, { recursive: true }); }

function imageDimensions(buf: Buffer, mime: string): { w: number | null; h: number | null } {
  if (mime === 'image/png' && buf.length >= 24) {
    // IHDR width/height at bytes 16-23
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return { w, h };
  }
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    // scan for SOF marker
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] === 0xff) {
        const marker = buf[i + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const h = buf.readUInt16BE(i + 5);
          const w = buf.readUInt16BE(i + 7);
          return { w, h };
        }
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      } else {
        i++;
      }
    }
  }
  return { w: null, h: null };
}

const ALLOWED = new Set(VISUALIZATION_CONFIG.allowedMimeTypes);

export async function registerBlueprintRoutes(app: FastifyInstance): Promise<void> {
  // Register raw buffer parser for multipart
  app.addContentTypeParser('multipart/form-data', { parseAs: 'buffer' }, (req, body, done) => {
    done(null, body);
  });

  // Upload (or replace) blueprint for a floor
  app.post('/api/floors/:floorId/blueprint', async (req, reply) => {
    const floorId = (req.params as { floorId: string }).floorId;
    const db = getDb();
    const floor = getFloor(db, floorId);
    if (!floor) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Floor not found', requestId: req.id } });
      return;
    }
    const ct = String(req.headers['content-type'] || '');
    const buf = req.body as Buffer;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Empty upload', requestId: req.id } });
      return;
    }
    if (buf.length > VISUALIZATION_CONFIG.maxBlueprintBytes) {
      reply.code(413).send({ error: { code: 'INVALID_QUERY', message: 'File too large', requestId: req.id } });
      return;
    }
    const parts = parseMultipart(buf, ct);
    const filePart = parts.find((p: { name: string; filename?: string }) => p.name === 'file' && p.filename);
    if (!filePart) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'Missing file field', requestId: req.id } });
      return;
    }
    if (!ALLOWED.has(filePart.contentType)) {
      reply.code(415).send({ error: { code: 'INVALID_QUERY', message: 'Unsupported file type', requestId: req.id } });
      return;
    }
    // magic-byte validation
    const magicOk =
      (filePart.contentType === 'image/png' && filePart.data[0] === 0x89 && filePart.data[1] === 0x50) ||
      (filePart.contentType.startsWith('image/jpeg') && filePart.data[0] === 0xff && filePart.data[1] === 0xd8) ||
      (filePart.contentType === 'application/pdf' && filePart.data.subarray(0, 4).toString() === '%PDF');
    if (!magicOk) {
      reply.code(400).send({ error: { code: 'INVALID_QUERY', message: 'File content does not match declared type', requestId: req.id } });
      return;
    }

    ensureStorage();
    const ext = filePart.filename!.split('.').pop() || 'bin';
    const storedName = `${floorId}-${Date.now()}.${ext}`;
    const storedPath = path.join(STORAGE_ROOT, storedName);
    writeFileSync(storedPath, filePart.data);
    const dims = imageDimensions(filePart.data, filePart.contentType);

    // Replace: remove previous blueprints for this floor? Keep history; store new.
    const bp = createBlueprint(db, { floorId, storagePath: storedPath, mimeType: filePart.contentType });
    reply.code(201).send({ data: { ...bp, width: dims.w, height: dims.h }, meta: { serverTime: toIso(new Date()) } });
  });

  // Serve blueprint file
  app.get('/api/blueprints/:id/file', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    // find blueprint
    const row = db.prepare('SELECT * FROM blueprints WHERE id = ?').get(id) as { storage_path: string; mime_type: string | null } | undefined;
    if (!row) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Blueprint not found', requestId: req.id } });
      return;
    }
    if (!existsSync(row.storage_path)) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'File missing', requestId: req.id } });
      return;
    }
    const buf = readFileSync(row.storage_path);
    reply.header('Content-Type', row.mime_type || 'application/octet-stream');
    reply.header('Content-Disposition', 'inline');
    reply.send(buf);
  });

  // Delete blueprint
  app.delete('/api/blueprints/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const db = getDb();
    const row = db.prepare('SELECT storage_path FROM blueprints WHERE id = ?').get(id) as { storage_path: string } | undefined;
    if (!row) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Blueprint not found', requestId: req.id } });
      return;
    }
    deleteBlueprint(db, id);
    try { if (existsSync(row.storage_path)) unlinkSync(row.storage_path); } catch { /* ignore */ }
    reply.code(204).send();
  });

  // List blueprints for a floor
  app.get('/api/floors/:floorId/blueprints', async (req, reply) => {
    const floorId = (req.params as { floorId: string }).floorId;
    const db = getDb();
    const bps = listBlueprints(db, floorId);
    reply.send({ data: bps, meta: { serverTime: toIso(new Date()), total: bps.length } });
  });
}
