import { buildMockAlerts, buildMockDevices, mockClients, mockSites } from "@/mocks/data";
import type {
  Alert,
  AlertFilter,
  AlertPriority,
  Client,
  DashboardSummary,
  DattoProvider,
  Device,
  DeviceFilter,
  SearchResults,
  Site,
} from "./types";

const PRIORITY_RANK: Record<AlertPriority, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
  information: 4,
};

export const WARNING_PRIORITIES: readonly AlertPriority[] = ["high", "moderate"];

/** Trie par gravité décroissante puis par date la plus récente. */
export function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt),
  );
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/**
 * Fournisseur de données FICTIVES pour la maquette (phase 1).
 * N'effectue aucun appel réseau.
 */
export class MockDattoProvider implements DattoProvider {
  readonly source = "mock" as const;

  constructor(private readonly now: () => Date = () => new Date()) {}

  private devices(): Device[] {
    return buildMockDevices(this.now());
  }

  private alerts(): Alert[] {
    return buildMockAlerts(this.now());
  }

  async listClients(): Promise<Client[]> {
    return [...mockClients];
  }

  async getClient(id: string): Promise<Client | null> {
    return mockClients.find((c) => c.id === id) ?? null;
  }

  async listSites(clientId?: string): Promise<Site[]> {
    return mockSites.filter((s) => !clientId || s.clientId === clientId);
  }

  async getSite(uid: string): Promise<Site | null> {
    return mockSites.find((s) => s.uid === uid) ?? null;
  }

  async listDevices(filter: DeviceFilter = {}): Promise<Device[]> {
    return this.devices().filter(
      (d) => (!filter.siteUid || d.siteUid === filter.siteUid) && (!filter.clientId || d.clientId === filter.clientId),
    );
  }

  async getDevice(uid: string): Promise<Device | null> {
    return this.devices().find((d) => d.uid === uid) ?? null;
  }

  async listAlerts(filter: AlertFilter = {}): Promise<Alert[]> {
    const filtered = this.alerts().filter(
      (a) =>
        (filter.includeResolved || !a.resolved) &&
        (!filter.priority || a.priority === filter.priority) &&
        (!filter.clientId || a.clientId === filter.clientId) &&
        (!filter.deviceUid || a.deviceUid === filter.deviceUid),
    );
    return sortAlerts(filtered);
  }

  async getAlert(uid: string): Promise<Alert | null> {
    return this.alerts().find((a) => a.uid === uid) ?? null;
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const open = this.alerts().filter((a) => !a.resolved);
    const devices = this.devices();
    const online = devices.filter((d) => d.online).length;
    return {
      criticalAlerts: open.filter((a) => a.priority === "critical").length,
      warningAlerts: open.filter((a) => WARNING_PRIORITIES.includes(a.priority)).length,
      devicesOnline: online,
      devicesOffline: devices.length - online,
      devicesTotal: devices.length,
      rebootRequired: devices.filter((d) => d.rebootRequired).length,
    };
  }

  async search(query: string): Promise<SearchResults> {
    const q = normalize(query);
    if (q.length < 2) return { clients: [], sites: [], devices: [] };
    const match = (...values: (string | undefined)[]) => values.some((v) => v && normalize(v).includes(q));
    return {
      clients: mockClients.filter((c) => match(c.name)),
      sites: mockSites.filter((s) => match(s.name, s.description)),
      devices: this.devices().filter((d) => match(d.hostname, d.description, d.lastLoggedInUser, d.internalIp)),
    };
  }
}
