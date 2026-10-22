import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dir = mkdtempSync(path.join(tmpdir(), 'lattice-test-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(dir, 'test.db');
process.env.SIMULATION_ENABLED = 'true';
process.env.SEED_ON_START = 'true';
process.env.ENABLE_DEV_ENDPOINTS = 'true';
process.env.API_KEY = '';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.LOG_LEVEL = 'fatal';
delete process.env.API_KEY;
// store for tests
(globalThis as { __TEST_DB_DIR__?: string }).__TEST_DB_DIR__ = dir;
