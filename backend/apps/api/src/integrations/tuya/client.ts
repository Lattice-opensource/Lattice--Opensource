import { createHash, createHmac, randomUUID } from 'node:crypto';
import type { TuyaDeviceInfo, TuyaDeviceStatusResponse, TuyaTokenResponse } from './types.js';

export const EMPTY_BODY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export class TuyaApiError extends Error {
  public readonly code?: string | number;
  public readonly statusCode?: number;

  constructor(code: string | number | undefined, message: string, statusCode?: number) {
    super(message);
    this.name = 'TuyaApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface TuyaClientConfig {
  accessId: string;
  accessSecret: string;
  baseUrl: string;
  timeoutMs?: number;
}

export interface TuyaClientLike {
  getToken(): Promise<string>;
  getDevice(deviceId: string): Promise<TuyaDeviceInfo>;
  getDeviceStatus(deviceId: string): Promise<TuyaDeviceStatusResponse>;
}

export class TuyaClient implements TuyaClientLike {
  private readonly accessId: string;
  private readonly accessSecret: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private tokenPromise: Promise<string> | null = null;

  constructor(config: TuyaClientConfig) {
    this.accessId = config.accessId;
    this.accessSecret = config.accessSecret;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs ?? 10000;
  }

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = this.fetchToken().finally(() => {
      this.tokenPromise = null;
    });
    return this.tokenPromise;
  }

  async getDevice(deviceId: string): Promise<TuyaDeviceInfo> {
    const token = await this.getToken();
    const json = (await this.request('GET', `/v2.0/cloud/thing/${deviceId}`, undefined, token)) as { result?: TuyaDeviceInfo };
    return (json?.result ?? {}) as TuyaDeviceInfo;
  }

  async getDeviceStatus(deviceId: string): Promise<TuyaDeviceStatusResponse> {
    const token = await this.getToken();
    const json = await this.request('GET', `/v1.0/iot-03/devices/${deviceId}/status`, undefined, token);
    return json as TuyaDeviceStatusResponse;
  }

  private async fetchToken(): Promise<string> {
    const json = (await this.request('GET', '/v1.0/token', { grant_type: '1' })) as TuyaTokenResponse;
    const result = json?.result;
    if (!result?.access_token) {
      throw new TuyaApiError(json?.code, json?.msg || 'Failed to obtain Tuya access token');
    }
    this.accessToken = result.access_token;
    this.tokenExpiresAt = Date.now() + (result.expire_time ?? 7200) * 1000;
    return this.accessToken;
  }

  private async request(
    method: string,
    path: string,
    query: Record<string, string> | undefined,
    accessToken?: string,
  ): Promise<unknown> {
    const queryString = query ? buildSortedQueryString(query) : '';
    const urlPath = queryString ? `${path}?${queryString}` : path;
    const fullUrl = `${this.baseUrl}${urlPath}`;

    const t = Date.now().toString();
    const nonce = randomUUID();
    const contentSha256 = sha256Hex('');
    const stringToSign = `${method}\n${contentSha256}\n\n${urlPath}`;

    const signPayload = accessToken
      ? `${this.accessId}${accessToken}${t}${nonce}${stringToSign}`
      : `${this.accessId}${t}${nonce}${stringToSign}`;
    const sign = hmacSha256Hex(signPayload, this.accessSecret);

    const headers: Record<string, string> = {
      client_id: this.accessId,
      t,
      sign_method: 'HMAC-SHA256',
      sign,
      nonce,
    };
    if (accessToken) headers.access_token = accessToken;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(fullUrl, { method, headers, signal: controller.signal });
      const text = await res.text();
      let json: any = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = { success: false, msg: text };
        }
      }
      if (!res.ok) {
        throw new TuyaApiError(json?.code, json?.msg || res.statusText || 'Tuya HTTP error', res.status);
      }
      if (json && json.success === false) {
        throw new TuyaApiError(json.code, json.msg || 'Tuya API error', res.status);
      }
      return json ?? {};
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new TuyaApiError('TIMEOUT', 'Tuya request timed out', 408);
      }
      if (err instanceof TuyaApiError) throw err;
      throw new TuyaApiError(undefined, err?.message || 'Tuya request failed');
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createTuyaClient(config: TuyaClientConfig): TuyaClient {
  return new TuyaClient(config);
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function hmacSha256Hex(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value, 'utf8').digest('hex').toUpperCase();
}

export function buildSortedQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k] as string)}`)
    .join('&');
}

/** Re-exported helper name for signing logic. */
export function signTuyaRequest(params: {
  method: string;
  path: string;
  query?: Record<string, string>;
  accessId: string;
  accessSecret: string;
  accessToken?: string;
  t: string;
  nonce: string;
}): string {
  const queryString = params.query ? buildSortedQueryString(params.query) : '';
  const urlPath = queryString ? `${params.path}?${queryString}` : params.path;
  const contentSha256 = sha256Hex('');
  const stringToSign = `${params.method}\n${contentSha256}\n\n${urlPath}`;
  const signPayload = params.accessToken
    ? `${params.accessId}${params.accessToken}${params.t}${params.nonce}${stringToSign}`
    : `${params.accessId}${params.t}${params.nonce}${stringToSign}`;
  return hmacSha256Hex(signPayload, params.accessSecret);
}