import { DattoNotImplementedError } from "./errors";
import type {
  Alert,
  Client,
  DashboardSummary,
  DattoProvider,
  Device,
  SearchResults,
  Site,
} from "./types";

export interface HttpDattoProviderConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  timeoutMs: number;
}

/**
 * Squelette du client de l'API officielle Datto RMM (REST v2, OAuth 2).
 *
 * PHASE 1 : NON CONNECTÉ. Chaque méthode lève `DattoNotImplementedError` et
 * aucune requête réseau n'est émise. L'implémentation se fera en phase 2, en
 * s'appuyant exclusivement sur la documentation officielle Datto RMM et un
 * accès API autorisé, puis sera testée avant d'être activée.
 *
 * Points à vérifier dans la documentation officielle avant implémentation :
 *  - obtention et renouvellement du jeton OAuth (endpoint, durée de validité) ;
 *  - endpoints sites / appareils / alertes et leur pagination ;
 *  - limites de débit (rate limiting) ;
 *  - possibilité ou non de résoudre une alerte, de lancer un Quick Job.
 *
 * Utiliser `fetchWithTimeout` (src/lib/utils) pour tous les appels.
 */
export class HttpDattoProvider implements DattoProvider {
  readonly source = "datto" as const;

  // La configuration est conservée pour la phase 2 ; elle ne quitte jamais le serveur.
  constructor(private readonly config: HttpDattoProviderConfig) {}

  private notImplemented(feature: string): never {
    throw new DattoNotImplementedError(feature);
  }

  // Méthodes `async` : l'erreur est rejetée via la promesse, comme le ferait un vrai appel réseau.

  async listClients(): Promise<Client[]> {
    return this.notImplemented("listClients");
  }
  async getClient(): Promise<Client | null> {
    return this.notImplemented("getClient");
  }
  async listSites(): Promise<Site[]> {
    return this.notImplemented("listSites");
  }
  async getSite(): Promise<Site | null> {
    return this.notImplemented("getSite");
  }
  async listDevices(): Promise<Device[]> {
    return this.notImplemented("listDevices");
  }
  async getDevice(): Promise<Device | null> {
    return this.notImplemented("getDevice");
  }
  async listAlerts(): Promise<Alert[]> {
    return this.notImplemented("listAlerts");
  }
  async getAlert(): Promise<Alert | null> {
    return this.notImplemented("getAlert");
  }
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.notImplemented("getDashboardSummary");
  }
  async search(): Promise<SearchResults> {
    return this.notImplemented("search");
  }
}
