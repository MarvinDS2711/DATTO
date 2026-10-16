import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout";
import { DattoError, DattoHttpError } from "./errors";
import { mapAlert, mapDevice, mapList, mapSite } from "./mapping";
import { filterAlerts, filterDevices, searchAll, summarize } from "./query";
import type {
  Alert,
  AlertFilter,
  Client,
  DashboardSummary,
  DattoProvider,
  Device,
  DeviceFilter,
  SearchResults,
  Site,
} from "./types";

export interface HttpDattoProviderConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  timeoutMs: number;
  /** Durée de mise en cache des listes (ms), pour limiter les appels. */
  cacheTtlMs?: number;
  fetchImpl?: typeof fetch;
}

/** Client OAuth « public » utilisé par l'exemple officiel Datto pour l'API v2 (à valider). */
const OAUTH_CLIENT = "public-client:public";
const MAX_PAGES = 50;
const MAX_RESOLVED_PAGES = 3;

/**
 * Client de l'API officielle Datto RMM v2 — LECTURE SEULE.
 *
 * Seules des requêtes GET sont envoyées vers /api/v2 (plus l'obtention du jeton
 * OAuth). Aucune méthode n'écrit quoi que ce soit dans Datto : pas de
 * résolution d'alerte, pas de job, pas d'action sur les appareils.
 *
 * Statut : implémenté d'après la documentation, À VALIDER sur un compte réel.
 */
export class HttpDattoProvider implements DattoProvider {
  readonly source = "datto" as const;

  private readonly apiUrl: URL;
  private readonly fetchImpl: typeof fetch;
  private readonly cacheTtlMs: number;
  private token: { value: string; expiresAt: number } | null = null;
  private tokenRequest: Promise<string> | null = null;
  private readonly cache = new Map<string, { at: number; value: Promise<unknown[]> }>();

  constructor(private readonly config: HttpDattoProviderConfig) {
    this.apiUrl = new URL(config.apiUrl);
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.cacheTtlMs = config.cacheTtlMs ?? 30_000;
  }

  // ---------------------------------------------------------------- jeton OAuth

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    this.tokenRequest ??= this.requestToken().finally(() => {
      this.tokenRequest = null;
    });
    return this.tokenRequest;
  }

  private async requestToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "password",
      username: this.config.apiKey,
      password: this.config.apiSecret,
    });
    const res = await fetchWithTimeout(
      new URL("/auth/oauth/token", this.apiUrl),
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(OAUTH_CLIENT).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
        timeoutMs: this.config.timeoutMs,
        cache: "no-store",
      },
      this.fetchImpl,
    );
    if (res.status === 400 || res.status === 401) {
      throw new DattoHttpError(res.status, "Authentification Datto refusée : vérifiez la clé et le secret API.");
    }
    if (!res.ok) throw new DattoHttpError(res.status, `Obtention du jeton Datto impossible (HTTP ${res.status}).`);
    const json = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof json.access_token !== "string") throw new DattoError("Réponse de jeton Datto inattendue.");
    const ttlSeconds = typeof json.expires_in === "number" ? json.expires_in : 3600;
    // Renouvellement 5 minutes avant l'expiration annoncée.
    this.token = { value: json.access_token, expiresAt: Date.now() + Math.max(60, ttlSeconds - 300) * 1000 };
    return this.token.value;
  }

  // ------------------------------------------------------------- requêtes GET

  private async get(url: URL, retryOnAuth = true): Promise<unknown> {
    // Le jeton n'est envoyé qu'à l'hôte Datto configuré.
    if (url.origin !== this.apiUrl.origin) throw new DattoError("URL de pagination hors de l'API Datto : ignorée.");
    const res = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${await this.getToken()}`, Accept: "application/json" },
        timeoutMs: this.config.timeoutMs,
        cache: "no-store",
      },
      this.fetchImpl,
    );
    if (res.status === 401 && retryOnAuth) {
      this.token = null;
      return this.get(url, false);
    }
    if (res.status === 404) return null;
    if (res.status === 429) throw new DattoHttpError(429, "Limite d'appels Datto atteinte, réessayez dans une minute.");
    if (res.status === 403) throw new DattoHttpError(403, "Accès refusé par Datto : droits insuffisants pour ce compte API.");
    if (!res.ok) throw new DattoHttpError(res.status, `Datto RMM a répondu HTTP ${res.status}.`);
    return res.json();
  }

  /** Récupère une liste paginée (`pageDetails.nextPageUrl`). */
  private async getAll(path: string, key: string, maxPages = MAX_PAGES): Promise<unknown[]> {
    const items: unknown[] = [];
    let next: URL | null = new URL(path, this.apiUrl);
    for (let page = 0; next && page < maxPages; page++) {
      const json = (await this.get(next)) as Record<string, unknown> | null;
      if (!json) break;
      const chunk = json[key];
      if (Array.isArray(chunk)) items.push(...chunk);
      const nextUrl = (json.pageDetails as { nextPageUrl?: unknown } | undefined)?.nextPageUrl;
      next = typeof nextUrl === "string" && nextUrl ? new URL(nextUrl, this.apiUrl) : null;
    }
    return items;
  }

  private cached(key: string, load: () => Promise<unknown[]>): Promise<unknown[]> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.cacheTtlMs) return hit.value;
    const value = load().catch((error: unknown) => {
      this.cache.delete(key);
      throw error;
    });
    this.cache.set(key, { at: Date.now(), value });
    return value;
  }

  private async sites(): Promise<Site[]> {
    return mapList(await this.cached("sites", () => this.getAll("/api/v2/account/sites", "sites")), mapSite);
  }

  private async devices(): Promise<Device[]> {
    return mapList(await this.cached("devices", () => this.getAll("/api/v2/account/devices", "devices")), mapDevice);
  }

  private async openAlerts(): Promise<Alert[]> {
    return mapList(
      await this.cached("alerts-open", () => this.getAll("/api/v2/account/alerts/open", "alerts")),
      mapAlert,
    );
  }

  private async resolvedAlerts(): Promise<Alert[]> {
    const raw = await this.cached("alerts-resolved", () =>
      this.getAll("/api/v2/account/alerts/resolved", "alerts", MAX_RESOLVED_PAGES),
    );
    return mapList(raw, mapAlert).map((a) => ({ ...a, resolved: true }));
  }

  // ------------------------------------------------------- interface publique

  async listClients(): Promise<Client[]> {
    return (await this.sites()).map((s) => ({ id: s.uid, name: s.name }));
  }

  async getClient(id: string): Promise<Client | null> {
    return (await this.listClients()).find((c) => c.id === id) ?? null;
  }

  async listSites(clientId?: string): Promise<Site[]> {
    return (await this.sites()).filter((s) => !clientId || s.clientId === clientId);
  }

  async getSite(uid: string): Promise<Site | null> {
    return (await this.sites()).find((s) => s.uid === uid) ?? null;
  }

  async listDevices(filter: DeviceFilter = {}): Promise<Device[]> {
    return filterDevices(await this.devices(), filter);
  }

  async getDevice(uid: string): Promise<Device | null> {
    return (await this.devices()).find((d) => d.uid === uid) ?? null;
  }

  async listAlerts(filter: AlertFilter = {}): Promise<Alert[]> {
    const alerts = await this.openAlerts();
    const all = filter.includeResolved ? [...alerts, ...(await this.resolvedAlerts())] : alerts;
    return filterAlerts(all, filter);
  }

  async getAlert(uid: string): Promise<Alert | null> {
    const known = (await this.openAlerts()).find((a) => a.uid === uid);
    if (known) return known;
    return mapAlert(await this.get(new URL(`/api/v2/alert/${encodeURIComponent(uid)}`, this.apiUrl)));
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const [alerts, devices] = await Promise.all([this.openAlerts(), this.devices()]);
    return summarize(alerts, devices);
  }

  async search(query: string): Promise<SearchResults> {
    const [clients, sites, devices] = await Promise.all([this.listClients(), this.sites(), this.devices()]);
    return searchAll(query, clients, sites, devices);
  }
}
