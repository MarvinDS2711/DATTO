import type { AlertPriority, Device } from "@/lib/datto/types";

export const PRIORITY_LABEL: Record<AlertPriority, string> = {
  critical: "Critique",
  high: "Élevée",
  moderate: "Modérée",
  low: "Faible",
  information: "Info",
};

export const DEVICE_TYPE_LABEL: Record<Device["type"], string> = {
  server: "Serveur",
  workstation: "Poste de travail",
  laptop: "Portable",
  network: "Réseau",
  other: "Autre",
};

export const ANTIVIRUS_LABEL: Record<Device["antivirusStatus"], string> = {
  running: "Actif",
  "not-running": "Inactif",
  "not-detected": "Non détecté",
  unknown: "Inconnu",
};

export const PATCH_LABEL: Record<Device["patchStatus"], string> = {
  "up-to-date": "À jour",
  pending: "En attente",
  failed: "Échec",
  unknown: "Inconnu",
};

/** « il y a 5 min », « il y a 3 h », « il y a 2 j ». */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }).format(
    new Date(iso),
  );
}
