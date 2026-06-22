/**
 * Product Config Service (Mobile)
 * Fetches product configs from backend and caches with AsyncStorage.
 * Falls back to cached version when offline or feature disabled.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as API_URL } from './config';

const CACHE_PREFIX = 'pocketor_config_';

export interface ProductConfig {
  id: string;
  name: string;
  jsonSchema: Record<string, any>;
  version: number;
  status: 'draft' | 'active' | 'archived';
  etag: string;
}

async function getAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/** Fetch all active configs, update cache per-config */
export async function fetchProductConfigs(token: string): Promise<ProductConfig[]> {
  try {
    const res = await fetch(`${API_URL}/product-configs`, {
      headers: await getAuthHeader(token),
    });
    if (!res.ok) throw new Error('Server error');
    const { data } = await res.json();
    // Cache each config individually keyed by id
    await Promise.all(
      (data as ProductConfig[]).map((c) =>
        AsyncStorage.setItem(CACHE_PREFIX + c.id, JSON.stringify(c))
      )
    );
    return data;
  } catch {
    // Offline fallback: return all cached configs
    const keys = await AsyncStorage.getAllKeys();
    const configKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (!configKeys.length) return [];
    const pairs = await AsyncStorage.multiGet(configKeys);
    return pairs.map(([, v]) => JSON.parse(v!));
  }
}

/** Fetch a single config, use ETag for cache freshness */
export async function fetchProductConfig(token: string, id: string): Promise<ProductConfig | null> {
  const cacheKey = CACHE_PREFIX + id;
  const cached   = await AsyncStorage.getItem(cacheKey);
  const etag     = cached ? JSON.parse(cached).etag : null;

  try {
    const headers: Record<string, string> = { ...(await getAuthHeader(token)) };
    if (etag) headers['If-None-Match'] = `"${etag}"`;

    const res = await fetch(`${API_URL}/product-configs/${id}`, { headers });
    if (res.status === 304 && cached) return JSON.parse(cached); // not modified
    if (!res.ok) throw new Error('Server error');
    const { data } = await res.json();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch {
    return cached ? JSON.parse(cached) : null;
  }
}

/** Call server calc endpoint */
export async function calcFromConfig(
  token: string,
  configId: string,
  inputs: Record<string, any>
): Promise<{ summary: any; schedule: any[] } | null> {
  try {
    const res = await fetch(`${API_URL}/product-configs/${configId}/calc`, {
      method:  'POST',
      headers: await getAuthHeader(token),
      body:    JSON.stringify(inputs),
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message);
    }
    const { data } = await res.json();
    return data;
  } catch (e: any) {
    throw new Error(e.message || 'Calculation failed');
  }
}

/** Initiate a gateway payment */
export async function initiateGatewayPayment(
  token: string,
  payload: {
    loanId: string;
    customerId: string;
    amount: number;
    currency?: string;
    idempotencyKey: string;
  }
): Promise<any> {
  const res = await fetch(`${API_URL}/payments/initiate`, {
    method:  'POST',
    headers: await getAuthHeader(token),
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
