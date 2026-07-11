import type {
  AdminUser,
  Ambulance,
  AnalyticsOverview,
  AuthUser,
  CreateIncidentInput,
  HeatmapPoint,
  Hospital,
  Incident,
  TokenPair,
  TriageInput,
  TriageResult,
} from './types.js';

export * from './types.js';

export interface EmergencyAiClientOptions {
  baseUrl: string;
  /** Optional token store; defaults to in-memory. */
  getToken?: () => string | null | Promise<string | null>;
  onTokens?: (tokens: TokenPair) => void | Promise<void>;
  fetch?: typeof fetch;
}

export class EmergencyAiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'EmergencyAiError';
  }
}

/**
 * Minimal, dependency-free, typed API client. Works in browsers and Node 18+.
 * Auth: pass `getToken` to attach a bearer token to every request.
 */
export class EmergencyAiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private inMemoryToken: string | null = null;

  constructor(private readonly opts: EmergencyAiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    // Native fetch must be invoked with the global as its `this`; storing it as
    // an instance field and calling this.fetchImpl(...) would lose that binding
    // ("Illegal invocation"), so bind it (or wrap a caller-supplied fetch).
    this.fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  // ── auth ──
  async register(email: string, password: string, displayName?: string): Promise<TokenPair> {
    return this.storeTokens(await this.req('POST', '/auth/register', { email, password, displayName }));
  }
  async login(email: string, password: string): Promise<TokenPair> {
    return this.storeTokens(await this.req('POST', '/auth/login', { email, password }));
  }
  async guest(): Promise<TokenPair> {
    return this.storeTokens(await this.req('POST', '/auth/guest'));
  }
  me(): Promise<AuthUser> {
    return this.req('GET', '/users/me');
  }

  // ── triage ──
  assess(input: TriageInput): Promise<TriageResult> {
    return this.req('POST', '/triage/assess', input);
  }

  // ── incidents ──
  createIncident(input: CreateIncidentInput): Promise<Incident> {
    return this.req('POST', '/incidents', input);
  }
  listIncidents(): Promise<Incident[]> {
    return this.req('GET', '/incidents');
  }
  getIncident(id: string): Promise<Incident> {
    return this.req('GET', `/incidents/${id}`);
  }
  updateIncidentStatus(id: string, status: Incident['status'], note?: string): Promise<Incident> {
    return this.req('PATCH', `/incidents/${id}/status`, { status, note });
  }

  // ── admin ──
  readonly admin = {
    listHospitals: (): Promise<Hospital[]> => this.req('GET', '/admin/hospitals'),
    createHospital: (data: Partial<Hospital>): Promise<Hospital> =>
      this.req('POST', '/admin/hospitals', data),
    updateHospital: (id: string, data: Partial<Hospital>): Promise<Hospital> =>
      this.req('PATCH', `/admin/hospitals/${id}`, data),
    deleteHospital: (id: string): Promise<{ deleted: string }> =>
      this.req('DELETE', `/admin/hospitals/${id}`),

    listAmbulances: (): Promise<Ambulance[]> => this.req('GET', '/admin/ambulances'),
    createAmbulance: (data: Partial<Ambulance>): Promise<Ambulance> =>
      this.req('POST', '/admin/ambulances', data),
    updateAmbulance: (id: string, data: Partial<Ambulance>): Promise<Ambulance> =>
      this.req('PATCH', `/admin/ambulances/${id}`, data),
    deleteAmbulance: (id: string): Promise<{ deleted: string }> =>
      this.req('DELETE', `/admin/ambulances/${id}`),

    listUsers: (): Promise<AdminUser[]> => this.req('GET', '/admin/users'),
    updateUserRole: (id: string, role: AuthUser['role']): Promise<AdminUser> =>
      this.req('PATCH', `/admin/users/${id}/role`, { role }),

    listIncidents: (status?: string): Promise<Incident[]> =>
      this.req('GET', `/admin/incidents${status ? `?status=${status}` : ''}`),
  };

  // ── analytics ──
  readonly analytics = {
    overview: (): Promise<AnalyticsOverview> => this.req('GET', '/analytics/overview'),
    responseTimes: (): Promise<unknown> => this.req('GET', '/analytics/response-times'),
    heatmap: (): Promise<{ points: HeatmapPoint[] }> => this.req('GET', '/analytics/heatmap'),
    trends: (days?: number): Promise<{ days: number; series: { date: string; count: number }[] }> =>
      this.req('GET', `/analytics/trends${days ? `?days=${days}` : ''}`),
  };

  // ── internals ──
  private async storeTokens(tokens: TokenPair): Promise<TokenPair> {
    this.inMemoryToken = tokens.accessToken;
    await this.opts.onTokens?.(tokens);
    return tokens;
  }

  private async token(): Promise<string | null> {
    if (this.opts.getToken) return this.opts.getToken();
    return this.inMemoryToken;
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.token();
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const msg = data?.message ?? res.statusText;
      throw new EmergencyAiError(Array.isArray(msg) ? msg.join(', ') : msg, res.status);
    }
    return data as T;
  }
}
