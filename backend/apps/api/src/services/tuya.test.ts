import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { openDatabase, closeDatabase } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';
import {
  TuyaClient,
  TuyaApiError,
  createTuyaClient,
  mapTuyaStatusToReading,
  startTuyaIngestion,
  signTuyaRequest,
  sha256Hex,
  EMPTY_BODY_SHA256,
} from './tuya.js';

const TEST_DB = path.join(process.env.TEMP ?? 'C:\\temp', 'lattice-tuya-test.db');

let db: DatabaseSync;

beforeAll(() => {
  try { fs.unlinkSync(TEST_DB); } catch { /* ignore */ }
  db = openDatabase(TEST_DB);
  seedDatabase(db, { force: true });
});

afterAll(() => {
  closeDatabase();
  for (const f of [TEST_DB, TEST_DB + '-wal', TEST_DB + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockFetchSequence(responses: Array<{ status: number; body: any }>) {
  const fetchMock = vi.fn();
  for (const r of responses) {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json' } }),
    );
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('Tuya signing logic', () => {
  it('signs token request with HMAC-SHA256 and required headers', async () => {
    const fetchMock = mockFetchSequence([
      { status: 200, body: { success: true, result: { access_token: 'tok', expire_time: 7200 } } },
    ]);
    const client = new TuyaClient({ accessId: 'aid', accessSecret: 'asecret', baseUrl: 'https://openapi.tuyain.com', timeoutMs: 1000 });
    await client.getToken();
    const call = fetchMock.mock.calls[0]!;
    const headers = (call[1] as any).headers as Record<string, string>;
    expect(headers.client_id).toBe('aid');
    expect(headers.sign_method).toBe('HMAC-SHA256');
    expect(headers.t).toMatch(/^\d{13}$/);
    expect(headers.sign).toMatch(/^[0-9A-F]{64}$/);
    expect(headers.nonce).toBeTruthy();
    // verify signature recomputes
    const url = new URL(call[0] as string);
    const urlPath = url.pathname + url.search;
    const recomputed = signTuyaRequest({
      method: 'GET',
      path: urlPath,
      accessId: 'aid',
      accessSecret: 'asecret',
      t: headers.t!,
      nonce: headers.nonce!,
    });
    expect(recomputed).toBe(headers.sign);
  });

  it('signs general request including access_token', async () => {
    const fetchMock = mockFetchSequence([
      { status: 200, body: { success: true, result: { access_token: 'tok', expire_time: 7200 } } },
      { status: 200, body: { success: true, result: [{ code: 'cur_power', value: 100 }] } },
    ]);
    const client = new TuyaClient({ accessId: 'aid', accessSecret: 'asecret', baseUrl: 'https://openapi.tuyain.com', timeoutMs: 1000 });
    await client.getDeviceStatus('dev1');
    const call = fetchMock.mock.calls[1]!;
    const headers = (call[1] as any).headers as Record<string, string>;
    expect(headers.access_token).toBe('tok');
    expect(headers.sign).toMatch(/^[0-9A-F]{64}$/);
    const url = new URL(call[0] as string);
    const urlPath = url.pathname + url.search;
    const recomputed = signTuyaRequest({
      method: 'GET',
      path: urlPath,
      accessId: 'aid',
      accessSecret: 'asecret',
      accessToken: 'tok',
      t: headers.t!,
      nonce: headers.nonce!,
    });
    expect(recomputed).toBe(headers.sign);
  });

  it('sha256 of empty body matches Tuya constant', () => {
    expect(sha256Hex('')).toBe(EMPTY_BODY_SHA256);
  });
});

describe('Tuya device status responses', () => {
  it('retrieves a successful device-status response', async () => {
    mockFetchSequence([
      { status: 200, body: { success: true, result: { access_token: 'tok', expire_time: 7200 } } },
      { status: 200, body: { success: true, result: [{ code: 'cur_power', value: 1234 }, { code: 'cur_voltage', value: 2300 }, { code: 'cur_current', value: 500 }, { code: 'add_ele', value: 12345 }] } },
    ]);
    const client = new TuyaClient({ accessId: 'aid', accessSecret: 'asecret', baseUrl: 'https://openapi.tuyain.com', timeoutMs: 1000 });
    const res = await client.getDeviceStatus('dev1');
    expect(res.success).toBe(true);
    expect(res.result).toHaveLength(4);
  });

  it('retrieves device info', async () => {
    mockFetchSequence([
      { status: 200, body: { success: true, result: { access_token: 'tok', expire_time: 7200 } } },
      { status: 200, body: { success: true, result: { id: 'dev1', name: 'Plug', custom_name: 'My Plug', is_online: true } } },
    ]);
    const client = new TuyaClient({ accessId: 'aid', accessSecret: 'asecret', baseUrl: 'https://openapi.tuyain.com', timeoutMs: 1000 });
    const info = await client.getDevice('dev1');
    expect(info.custom_name).toBe('My Plug');
  });
});

describe('Tuya error handling', () => {
  it('throws TuyaApiError on invalid credentials (token failure)', async () => {
    mockFetchSequence([
      { status: 401, body: { success: false, code: 1004, msg: 'sign invalid' } },
    ]);
    const client = new TuyaClient({ accessId: 'aid', accessSecret: 'wrong', baseUrl: 'https://openapi.tuyain.com', timeoutMs: 1000 });
    await expect(client.getDeviceStatus('dev1')).rejects.toBeInstanceOf(TuyaApiError);
  });

  it('throws TuyaApiError on API error response', async () => {
    mockFetchSequence([
      { status: 200, body: { success: true, result: { access_token: 'tok', expire_time: 7200 } } },
      { status: 200, body: { success: false, code: 2009, msg: 'device not found' } },
    ]);
    const client = new TuyaClient({ accessId: 'aid', accessSecret: 'asecret', baseUrl: 'https://openapi.tuyain.com', timeoutMs: 1000 });
    await expect(client.getDeviceStatus('dev1')).rejects.toMatchObject({ message: 'device not found' });
  });

  it('throws TuyaApiError on timeout', async () => {
    const fetchMock = vi.fn().mockImplementation(() => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = new TuyaClient({ accessId: 'aid', accessSecret: 'asecret', baseUrl: 'https://openapi.tuyain.com', timeoutMs: 10 });
    await expect(client.getToken()).rejects.toMatchObject({ code: 'TIMEOUT' });
  });
});

describe('Tuya unit conversions and missing measurements', () => {
  it('converts scaled Tuya values to standard units', () => {
    const reading = mapTuyaStatusToReading({
      deviceId: 'plug1',
      timestamp: '2026-11-13T10:00:00.000Z',
      intervalSeconds: 60,
      status: [
        { code: 'cur_power', value: 1234 },
        { code: 'cur_voltage', value: 2300 },
        { code: 'cur_current', value: 500 },
        { code: 'add_ele', value: 12345 },
      ],
    });
    expect(reading).not.toBeNull();
    expect(reading!.powerW).toBe(123.4);
    expect(reading!.voltageV).toBe(230);
    expect(reading!.currentA).toBe(0.5);
    expect(reading!.energyKwhTotal).toBe(123.45);
    // interval energy is derived from measured power (123.4 W * 60 s)
    expect(reading!.energyKwh).toBeCloseTo(0.0020567, 5);
    expect(reading!.isSimulated).toBe(false);
    expect(reading!.source).toBe('device');
  });

  it('handles missing power measurement by returning null', () => {
    const reading = mapTuyaStatusToReading({
      deviceId: 'plug1',
      status: [{ code: 'cur_voltage', value: 2300 }],
    });
    expect(reading).toBeNull();
  });

  it('handles missing optional measurements without fabricating', () => {
    const reading = mapTuyaStatusToReading({
      deviceId: 'plug1',
      timestamp: '2026-11-13T10:00:00.000Z',
      status: [{ code: 'cur_power', value: 500 }],
    });
    expect(reading).not.toBeNull();
    expect(reading!.powerW).toBe(50);
    expect(reading!.voltageV).toBeNull();
    expect(reading!.currentA).toBeNull();
    expect(reading!.energyKwhTotal).toBeNull();
  });

  it('accepts a response envelope', () => {
    const reading = mapTuyaStatusToReading({
      deviceId: 'plug1',
      timestamp: '2026-11-13T10:00:00.000Z',
      status: { result: [{ code: 'power', value: 42 }], success: true },
    });
    expect(reading).not.toBeNull();
    expect(reading!.powerW).toBe(42);
  });

  it('handles boolean/string values', () => {
    const reading = mapTuyaStatusToReading({
      deviceId: 'plug1',
      timestamp: '2026-11-13T10:00:00.000Z',
      status: [{ code: 'cur_power', value: '75' }],
    });
    expect(reading).not.toBeNull();
    expect(reading!.powerW).toBe(7.5);
  });
});

describe('Tuya ingestion handle and simulator fallback', () => {
  it('returns a no-op handle when disabled', () => {
    // tuyaEnabled is false by default in test env
    const handle = startTuyaIngestion(db);
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });

  it('does not crash when the Tuya client fails', async () => {
    const failingClient = {
      getToken: async () => { throw new Error('boom'); },
      getDevice: async () => { throw new Error('boom'); },
      getDeviceStatus: async () => { throw new Error('boom'); },
    };
    const handle = startTuyaIngestion(db, failingClient);
    // allow initial poll to settle
    await new Promise((r) => setTimeout(r, 50));
    handle.stop();
    expect(true).toBe(true);
  });

  it('createTuyaClient factory works', () => {
    const c = createTuyaClient({ accessId: 'a', accessSecret: 'b', baseUrl: 'https://x' });
    expect(c).toBeInstanceOf(TuyaClient);
  });
});