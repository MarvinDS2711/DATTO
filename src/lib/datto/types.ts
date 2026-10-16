/**
 * Modèle de domaine de l'application.
 *
 * Ces types sont volontairement découplés des réponses brutes de l'API Datto RMM :
 * le futur `HttpDattoProvider` aura la charge de convertir les réponses officielles
 * vers ce modèle, après vérification avec la documentation et un accès autorisé.
 */

export type DataSource = "mock" | "datto";

/** Priorités d'alerte telles que présentées dans l'application. */
export const ALERT_PRIORITIES = ["critical", "high", "moderate", "low", "information"] as const;
export type AlertPriority = (typeof ALERT_PRIORITIES)[number];

export type DeviceType = "server" | "workstation" | "laptop" | "network" | "other";

export interface Client {
  id: string;
  name: string;
}

export interface Site {
  uid: string;
  clientId: string;
  name: string;
  description?: string;
}

export interface Device {
  uid: string;
  siteUid: string;
  clientId: string;
  hostname: string;
  description?: string;
  type: DeviceType;
  operatingSystem: string;
  online: boolean;
  /** ISO 8601 */
  lastSeen: string;
  internalIp?: string;
  lastLoggedInUser?: string;
  rebootRequired: boolean;
  antivirusStatus: "running" | "not-running" | "not-detected" | "unknown";
  patchStatus: "up-to-date" | "pending" | "failed" | "unknown";
}

export interface Alert {
  uid: string;
  priority: AlertPriority;
  message: string;
  /** Catégorie lisible (ex. « Espace disque », « Service »). */
  category: string;
  deviceUid: string;
  siteUid: string;
  clientId: string;
  /** ISO 8601 */
  createdAt: string;
  resolved: boolean;
}

export interface AlertFilter {
  priority?: AlertPriority;
  clientId?: string;
  deviceUid?: string;
  includeResolved?: boolean;
}

export interface DeviceFilter {
  siteUid?: string;
  clientId?: string;
}

export interface DashboardSummary {
  criticalAlerts: number;
  warningAlerts: number;
  devicesOnline: number;
  devicesOffline: number;
  devicesTotal: number;
  rebootRequired: number;
}

export interface SearchResults {
  clients: Client[];
  sites: Site[];
  devices: Device[];
}

/**
 * Contrat unique d'accès aux données Datto. Les pages et API Routes ne dépendent
 * que de cette interface, jamais d'une implémentation concrète.
 */
export interface DattoProvider {
  readonly source: DataSource;
  listClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  listSites(clientId?: string): Promise<Site[]>;
  getSite(uid: string): Promise<Site | null>;
  listDevices(filter?: DeviceFilter): Promise<Device[]>;
  getDevice(uid: string): Promise<Device | null>;
  listAlerts(filter?: AlertFilter): Promise<Alert[]>;
  getAlert(uid: string): Promise<Alert | null>;
  getDashboardSummary(): Promise<DashboardSummary>;
  search(query: string): Promise<SearchResults>;
}
