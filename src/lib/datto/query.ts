import type {
  Alert,
  AlertFilter,
  AlertPriority,
  Client,
  DashboardSummary,
  Device,
  DeviceFilter,
  SearchResults,
  Site,
} from "./types";

/**
 * Logique de filtrage, tri et agrégation commune à tous les fournisseurs,
 * appliquée sur des listes déjà chargées.
 */

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

export function filterAlerts(alerts: Alert[], filter: AlertFilter = {}): Alert[] {
  return sortAlerts(
    alerts.filter(
      (a) =>
        (filter.includeResolved || !a.resolved) &&
        (!filter.priority || a.priority === filter.priority) &&
        (!filter.clientId || a.clientId === filter.clientId) &&
        (!filter.deviceUid || a.deviceUid === filter.deviceUid),
    ),
  );
}

export function filterDevices(devices: Device[], filter: DeviceFilter = {}): Device[] {
  return devices.filter(
    (d) => (!filter.siteUid || d.siteUid === filter.siteUid) && (!filter.clientId || d.clientId === filter.clientId),
  );
}

export function summarize(alerts: Alert[], devices: Device[]): DashboardSummary {
  const open = alerts.filter((a) => !a.resolved);
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

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function searchAll(query: string, clients: Client[], sites: Site[], devices: Device[]): SearchResults {
  const q = normalize(query);
  if (q.length < 2) return { clients: [], sites: [], devices: [] };
  const match = (...values: (string | undefined)[]) => values.some((v) => v && normalize(v).includes(q));
  return {
    clients: clients.filter((c) => match(c.name)),
    sites: sites.filter((s) => match(s.name, s.description)),
    devices: devices.filter((d) => match(d.hostname, d.description, d.lastLoggedInUser, d.internalIp)),
  };
}
