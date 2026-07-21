import { BadGatewayException, HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Query = Record<string, string | number | boolean | null | undefined>;

// Calls scoped to the app user's own Bearer (Directus enforces per-user authz).
export interface ScopedClient {
  get(path: string, opts?: { query?: Query }): Promise<any>;
  post(path: string, body: unknown): Promise<any>;
  patch(path: string, body: unknown): Promise<any>;
}

@Injectable()
export class DirectusService {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;

  // In-memory admin session cache (the only cache this gateway has).
  private token: string | null = null;
  private expiresAt = 0;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('DIRECTUS_URL').replace(/\/+$/, '');
    this.email = config.getOrThrow<string>('DIRECTUS_ADMIN_EMAIL');
    this.password = config.getOrThrow<string>('DIRECTUS_ADMIN_PASSWORD');
  }

  // --- admin-token content reads/writes (public content) --------------------
  get(path: string, opts: { query?: Query } = {}): Promise<any> {
    return this.adminCall('GET', path, opts);
  }
  post(path: string, body: unknown): Promise<any> {
    return this.adminCall('POST', path, { body });
  }
  patch(path: string, body: unknown): Promise<any> {
    return this.adminCall('PATCH', path, { body });
  }

  // --- unauthenticated pass-through (used for /auth/*) -----------------------
  authPost(path: string, body: unknown): Promise<any> {
    return this.raw('POST', path, { body }).then((res) => this.parse(res));
  }

  // --- user-scoped calls (forward the app user's Bearer) ---------------------
  withUserToken<T>(bearer: string, fn: (client: ScopedClient) => Promise<T>): Promise<T> {
    const token = bearer.replace(/^Bearer\s+/i, '').trim();
    const client: ScopedClient = {
      get: (path, opts = {}) => this.raw('GET', path, { query: opts.query, token }).then((r) => this.parse(r)),
      post: (path, body) => this.raw('POST', path, { body, token }).then((r) => this.parse(r)),
      patch: (path, body) => this.raw('PATCH', path, { body, token }).then((r) => this.parse(r)),
    };
    return fn(client);
  }

  // --- raw asset passthrough (returns the upstream Response to stream) -------
  async assetResponse(id: string, query: Query): Promise<Response> {
    let res = await this.raw('GET', `/assets/${id}`, { query, token: await this.adminToken() });
    if (res.status === 401) {
      this.token = null;
      res = await this.raw('GET', `/assets/${id}`, { query, token: await this.adminToken() });
    }
    if (!res.ok) throw this.mapError(res.status, await res.text());
    return res;
  }

  // --- internals ------------------------------------------------------------
  private async adminCall(method: string, path: string, opts: { query?: Query; body?: unknown }): Promise<any> {
    let res = await this.raw(method, path, { ...opts, token: await this.adminToken() });
    if (res.status === 401) {
      this.token = null; // stale/expired admin token - re-auth once and retry.
      res = await this.raw(method, path, { ...opts, token: await this.adminToken() });
    }
    return this.parse(res);
  }

  private async adminToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt) return this.token;
    const res = await this.raw('POST', '/auth/login', { body: { email: this.email, password: this.password } });
    if (!res.ok) throw this.mapError(res.status, await res.text());
    const { data } = await res.json();
    this.token = data.access_token as string;
    // Directus `expires` is milliseconds; keep a 10s safety margin.
    this.expiresAt = Date.now() + Number(data.expires) - 10_000;
    return this.token!;
  }

  private raw(
    method: string,
    path: string,
    opts: { query?: Query; body?: unknown; token?: string } = {},
  ): Promise<Response> {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = {};
    if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    return fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  }

  // Parse a Directus JSON envelope; map non-2xx to a proper Nest HttpException.
  private async parse(res: Response): Promise<any> {
    if (res.ok) {
      if (res.status === 204) return null;
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text).data;
    }
    throw this.mapError(res.status, await res.text());
  }

  private mapError(status: number, body: string): HttpException {
    const message = extractMessage(body) ?? `Directus request failed (${status})`;
    if (status === 401) return new UnauthorizedException(message);
    if (status === 403 || status === 404) return new NotFoundException(message);
    return new BadGatewayException(message);
  }
}

function extractMessage(body: string): string | undefined {
  try {
    return JSON.parse(body)?.errors?.[0]?.message;
  } catch {
    return body || undefined;
  }
}
