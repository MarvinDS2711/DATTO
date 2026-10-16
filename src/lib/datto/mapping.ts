import type { Alert, AlertPriority, Device, DeviceType, Site } from "./types";

/**
 * Conversion des réponses brutes de l'API Datto RMM v2 vers le modèle de domaine.
 *
 * Les noms de champs suivent la documentation publique de l'API v2 (Swagger de
 * la plateforme). Ils restent À VALIDER sur un vrai compte : chaque lecture est
 * défensive (champ absent → valeur « inconnue ») pour ne jamais planter l'UI.
 * `npm run datto:check` liste les champs réellement reçus.
 */

type Raw = Record<string, unknown>;

function obj(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function bool(value: unknown): boolean {
  return value === true || value === "true";
}

/** Datto renvoie des dates en millisecondes epoch (ou parfois en chaîne ISO). */
export function toIso(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Valeurs en secondes improbables mais tolérées.
    return new Date(value < 1e12 ? value * 1000 : value).toISOString();
  }
  if (typeof value === "string") {
    const asNumber = Number(value);
    if (value.trim() !== "" && Number.isFinite(asNumber)) return toIso(asNumber);
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date(0).toISOString();
}

export function mapSite(raw: unknown): Site | null {
  const r = obj(raw);
  const uid = str(r.uid);
  if (!uid) return null;
  return {
    uid,
    // Datto RMM n'a pas de niveau « client » au-dessus des sites : un site = un client.
    clientId: uid,
    name: str(r.name) ?? uid,
    description: str(r.description),
  };
}

export function mapDeviceType(raw: unknown): DeviceType {
  const t = obj(raw);
  const label = `${str(t.category) ?? ""} ${str(t.type) ?? ""}`.toLowerCase();
  if (label.includes("server")) return "server";
  if (label.includes("laptop")) return "laptop";
  if (label.includes("desktop") || label.includes("workstation")) return "workstation";
  if (/(network|router|switch|firewall|printer|esxi|snmp)/.test(label)) return "network";
  return "other";
}

export function mapAntivirus(raw: unknown): Device["antivirusStatus"] {
  const s = (str(obj(raw).antivirusStatus) ?? "").toLowerCase();
  if (s.startsWith("running")) return "running";
  if (s.startsWith("notrunning") || s === "not running") return "not-running";
  if (s.startsWith("notdetected") || s === "not detected") return "not-detected";
  return "unknown";
}

export function mapPatchStatus(raw: unknown): Device["patchStatus"] {
  const s = (str(obj(raw).patchStatus) ?? "").toLowerCase();
  if (s === "fullypatched") return "up-to-date";
  if (s.includes("pending") || s === "rebootrequired") return "pending";
  if (s.includes("error") || s.includes("fail")) return "failed";
  return "unknown";
}

export function mapDevice(raw: unknown): Device | null {
  const r = obj(raw);
  const uid = str(r.uid);
  const siteUid = str(r.siteUid);
  if (!uid || !siteUid) return null;
  return {
    uid,
    siteUid,
    clientId: siteUid,
    hostname: str(r.hostname) ?? uid,
    description: str(r.description),
    type: mapDeviceType(r.deviceType),
    operatingSystem: str(r.operatingSystem) ?? "Inconnu",
    online: bool(r.online),
    lastSeen: toIso(r.lastSeen),
    internalIp: str(r.intIpAddress),
    lastLoggedInUser: str(r.lastLoggedInUser),
    rebootRequired: bool(r.rebootRequired),
    antivirusStatus: mapAntivirus(r.antivirus),
    patchStatus: mapPatchStatus(r.patchManagement),
  };
}

export function mapPriority(value: unknown): AlertPriority {
  const p = (str(value) ?? "").toLowerCase();
  if (p === "critical" || p === "high" || p === "moderate" || p === "low") return p;
  return "information";
}

/** « perf_disk_usage_ctx » → « Perf disk usage » ; « comp_script_ctx » → « Comp script ». */
export function categoryFromContext(context: unknown): string {
  const cls = str(obj(context)["@class"]);
  if (!cls) return "Alerte";
  const words = cls.replace(/_ctx$/i, "").replace(/[_-]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Alerte";
}

export function mapAlert(raw: unknown): Alert | null {
  const r = obj(raw);
  const uid = str(r.alertUid) ?? str(r.uid);
  if (!uid) return null;
  const source = obj(r.alertSourceInfo);
  const siteUid = str(source.siteUid) ?? "";
  return {
    uid,
    priority: mapPriority(r.priority),
    message: str(r.diagnostics)?.trim() ?? str(source.deviceName) ?? "Alerte sans description",
    category: categoryFromContext(r.alertContext),
    deviceUid: str(source.deviceUid) ?? "",
    siteUid,
    clientId: siteUid,
    createdAt: toIso(r.timestamp),
    resolved: bool(r.resolved),
  };
}

export function mapList<T>(items: unknown[], mapper: (raw: unknown) => T | null): T[] {
  return items.map(mapper).filter((v): v is T => v !== null);
}
