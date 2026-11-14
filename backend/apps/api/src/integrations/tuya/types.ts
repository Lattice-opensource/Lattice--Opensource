/** Tuya Cloud device status entry. */
export interface TuyaStatusItem {
  code: string;
  value: unknown;
}

/** Tuya Cloud device details (subset of fields we use). */
export interface TuyaDeviceInfo {
  id?: string;
  name?: string;
  custom_name?: string;
  product_name?: string;
  product_id?: string;
  category?: string;
  is_online?: boolean;
  uuid?: string;
  model?: string;
}

/** Response envelope returned by Tuya Cloud device status endpoint. */
export interface TuyaDeviceStatusResponse {
  result?: TuyaStatusItem[];
  success?: boolean;
  t?: number;
  msg?: string;
  code?: string | number;
}

/** Response envelope returned by Tuya Cloud token endpoint. */
export interface TuyaTokenResponse {
  result?: {
    access_token: string;
    refresh_token?: string;
    expire_time?: number;
    uid?: string;
  };
  success?: boolean;
  t?: number;
  msg?: string;
  code?: string | number;
}