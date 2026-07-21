import * as SecureStore from 'expo-secure-store';
import type { Category, Occasion, Place, TasteProfile } from './types';

/**
 * Client for the Unlocking London BFF. The app talks ONLY to this backend;
 * Directus stays internal. Public content needs no token; /me/* calls attach
 * the stored Bearer and transparently refresh on a 401.
 */

// Simulator can use localhost; a physical device must use the Mac's LAN IP.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BASE = `${API_URL}/v1`;

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires?: number;
}

const TOKEN_KEY = 'ul_tokens';

export async function getTokens(): Promise<Tokens | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  return raw ? (JSON.parse(raw) as Tokens) : null;
}
async function setTokens(t: Tokens | null) {
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(t));
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) throw new ApiError(res.status, data?.message ?? res.statusText);
  return data as T;
}

// Public request (no auth).
async function pub<T>(path: string, init?: RequestInit): Promise<T> {
  return parse<T>(await fetch(`${BASE}${path}`, init));
}

// Authenticated request: attach Bearer, refresh once on 401.
async function auth<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const tokens = await getTokens();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
    },
  });
  if (res.status === 401 && retry && tokens?.refresh_token) {
    const ok = await refresh().catch(() => false);
    if (ok) return auth<T>(path, init, false);
  }
  return parse<T>(res);
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// --- Auth ---
export async function login(email: string, password: string) {
  const t = await pub<Tokens>('/auth/login', jsonInit('POST', { email, password }));
  await setTokens(t);
}
export async function refresh(): Promise<boolean> {
  const current = await getTokens();
  if (!current?.refresh_token) return false;
  const t = await pub<Tokens>('/auth/refresh', jsonInit('POST', { refresh_token: current.refresh_token }));
  await setTokens(t);
  return true;
}
export async function loginApple(identityToken: string | null, fullName?: string | null) {
  const t = await pub<Tokens>('/auth/apple', jsonInit('POST', { identityToken, fullName }));
  await setTokens(t);
}
export async function logout() {
  const current = await getTokens();
  await pub('/auth/logout', jsonInit('POST', { refresh_token: current?.refresh_token })).catch(() => undefined);
  await setTokens(null);
}
export function getMe() {
  return auth<{ id: string; email: string; first_name?: string }>('/me');
}

// --- Content ---
export const getPlaces = () => pub<Place[]>('/places');
export const getPlace = (id: string) => pub<Place>(`/places/${id}`);
export const getCategories = () => pub<Category[]>('/categories');
export const getOccasions = () => pub<Occasion[]>('/occasions');

// --- Taste profile (per-user) ---
export const getTasteProfile = () => auth<TasteProfile | null>('/me/taste-profile');
export const putTasteProfile = (onboarding: TasteProfile['onboarding']) =>
  auth<TasteProfile>('/me/taste-profile', jsonInit('PUT', { onboarding }));

/** Transformed image URL served by the BFF (Directus/R2 stays private). */
export function assetUrl(
  fileId?: string | null,
  opts: { width?: number; height?: number; quality?: number; fit?: 'cover' | 'contain' } = {},
): string | undefined {
  if (!fileId) return undefined;
  const p = new URLSearchParams();
  if (opts.width) p.set('width', String(opts.width));
  if (opts.height) p.set('height', String(opts.height));
  p.set('quality', String(opts.quality ?? 80));
  p.set('fit', opts.fit ?? 'cover');
  return `${BASE}/assets/${fileId}?${p.toString()}`;
}
