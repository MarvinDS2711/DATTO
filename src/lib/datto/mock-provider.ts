import { buildMockAlerts, buildMockDevices, mockClients, mockSites } from "@/mocks/data";
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

export { sortAlerts, WARNING_PRIORITIES } from "./query";

/**
 * Fournisseur de données FICTIVES pour la maquette.
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
    return filterDevices(this.devices(), filter);
  }

  async getDevice(uid: string): Promise<Device | null> {
    return this.devices().find((d) => d.uid === uid) ?? null;
  }

  async listAlerts(filter: AlertFilter = {}): Promise<Alert[]> {
    return filterAlerts(this.alerts(), filter);
  }

  async getAlert(uid: string): Promise<Alert | null> {
    return this.alerts().find((a) => a.uid === uid) ?? null;
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return summarize(this.alerts(), this.devices());
  }

  async search(query: string): Promise<SearchResults> {
    return searchAll(query, mockClients, mockSites, this.devices());
  }
}
