/**
 * ⚠️ DONNÉES FICTIVES — MAQUETTE UNIQUEMENT ⚠️
 *
 * Aucun de ces clients, sites, appareils ou alertes n'existe. Ils servent à
 * construire l'interface en phase 1, sans connexion à l'API Datto RMM.
 * Tous les identifiants sont préfixés par `mock-` et tous les noms de clients
 * par « Démo » pour qu'ils ne puissent pas être confondus avec des données réelles.
 */
import type { Alert, Client, Device, Site } from "@/lib/datto/types";

export const MOCK_PREFIX = "mock-";

/** Date ISO relative à `now` (en minutes dans le passé). */
function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

export const mockClients: Client[] = [
  { id: "mock-client-1", name: "Démo – Cabinet Durand Avocats" },
  { id: "mock-client-2", name: "Démo – Boulangeries Martin" },
  { id: "mock-client-3", name: "Démo – Clinique Vétérinaire du Parc" },
];

export const mockSites: Site[] = [
  { uid: "mock-site-1", clientId: "mock-client-1", name: "Paris – Siège", description: "Bureaux principaux" },
  { uid: "mock-site-2", clientId: "mock-client-1", name: "Lyon – Agence" },
  { uid: "mock-site-3", clientId: "mock-client-2", name: "Atelier central" },
  { uid: "mock-site-4", clientId: "mock-client-2", name: "Boutique Centre-ville" },
  { uid: "mock-site-5", clientId: "mock-client-3", name: "Clinique" },
];

export function buildMockDevices(now: Date): Device[] {
  return [
    {
      uid: "mock-dev-01", siteUid: "mock-site-1", clientId: "mock-client-1", hostname: "DUR-DC01",
      description: "Contrôleur de domaine", type: "server", operatingSystem: "Windows Server 2022 Standard",
      online: true, lastSeen: minutesAgo(now, 1), internalIp: "10.0.10.10", lastLoggedInUser: "DURAND\\admin.it",
      rebootRequired: true, antivirusStatus: "running", patchStatus: "pending",
    },
    {
      uid: "mock-dev-02", siteUid: "mock-site-1", clientId: "mock-client-1", hostname: "DUR-FS01",
      description: "Serveur de fichiers", type: "server", operatingSystem: "Windows Server 2019 Standard",
      online: true, lastSeen: minutesAgo(now, 2), internalIp: "10.0.10.11",
      rebootRequired: false, antivirusStatus: "running", patchStatus: "up-to-date",
    },
    {
      uid: "mock-dev-03", siteUid: "mock-site-1", clientId: "mock-client-1", hostname: "DUR-PC-ACCUEIL",
      type: "workstation", operatingSystem: "Windows 11 Pro", online: false, lastSeen: minutesAgo(now, 60 * 14),
      internalIp: "10.0.10.52", lastLoggedInUser: "DURAND\\accueil",
      rebootRequired: false, antivirusStatus: "running", patchStatus: "up-to-date",
    },
    {
      uid: "mock-dev-04", siteUid: "mock-site-1", clientId: "mock-client-1", hostname: "DUR-LT-SDURAND",
      type: "laptop", operatingSystem: "Windows 11 Pro", online: true, lastSeen: minutesAgo(now, 4),
      lastLoggedInUser: "DURAND\\s.durand", rebootRequired: false, antivirusStatus: "not-running", patchStatus: "failed",
    },
    {
      uid: "mock-dev-05", siteUid: "mock-site-2", clientId: "mock-client-1", hostname: "DUR-LYO-PC01",
      type: "workstation", operatingSystem: "Windows 10 Pro", online: true, lastSeen: minutesAgo(now, 3),
      internalIp: "10.0.20.21", rebootRequired: true, antivirusStatus: "running", patchStatus: "pending",
    },
    {
      uid: "mock-dev-06", siteUid: "mock-site-2", clientId: "mock-client-1", hostname: "DUR-LYO-FW",
      description: "Pare-feu agence", type: "network", operatingSystem: "Équipement réseau (SNMP)",
      online: true, lastSeen: minutesAgo(now, 5), internalIp: "10.0.20.1",
      rebootRequired: false, antivirusStatus: "not-detected", patchStatus: "unknown",
    },
    {
      uid: "mock-dev-07", siteUid: "mock-site-3", clientId: "mock-client-2", hostname: "MAR-SRV01",
      description: "Serveur caisse / ERP", type: "server", operatingSystem: "Windows Server 2016 Standard",
      online: false, lastSeen: minutesAgo(now, 38), internalIp: "192.168.1.5",
      rebootRequired: false, antivirusStatus: "running", patchStatus: "pending",
    },
    {
      uid: "mock-dev-08", siteUid: "mock-site-3", clientId: "mock-client-2", hostname: "MAR-PC-COMPTA",
      type: "workstation", operatingSystem: "Windows 11 Pro", online: true, lastSeen: minutesAgo(now, 1),
      lastLoggedInUser: "MARTIN\\compta", rebootRequired: false, antivirusStatus: "running", patchStatus: "up-to-date",
    },
    {
      uid: "mock-dev-09", siteUid: "mock-site-4", clientId: "mock-client-2", hostname: "MAR-CAISSE-01",
      type: "workstation", operatingSystem: "Windows 10 IoT Enterprise", online: true, lastSeen: minutesAgo(now, 2),
      rebootRequired: false, antivirusStatus: "running", patchStatus: "up-to-date",
    },
    {
      uid: "mock-dev-10", siteUid: "mock-site-5", clientId: "mock-client-3", hostname: "VET-SRV-IMG",
      description: "Serveur imagerie", type: "server", operatingSystem: "Windows Server 2022 Standard",
      online: true, lastSeen: minutesAgo(now, 1), internalIp: "172.16.0.20",
      rebootRequired: false, antivirusStatus: "running", patchStatus: "up-to-date",
    },
    {
      uid: "mock-dev-11", siteUid: "mock-site-5", clientId: "mock-client-3", hostname: "VET-PC-CONSULT1",
      type: "workstation", operatingSystem: "Windows 11 Pro", online: true, lastSeen: minutesAgo(now, 6),
      rebootRequired: false, antivirusStatus: "running", patchStatus: "up-to-date",
    },
    {
      uid: "mock-dev-12", siteUid: "mock-site-5", clientId: "mock-client-3", hostname: "VET-MAC-ACCUEIL",
      type: "workstation", operatingSystem: "macOS 15", online: false, lastSeen: minutesAgo(now, 60 * 30),
      rebootRequired: false, antivirusStatus: "unknown", patchStatus: "unknown",
    },
  ];
}

export function buildMockAlerts(now: Date): Alert[] {
  return [
    {
      uid: "mock-alert-01", priority: "critical", category: "Disponibilité",
      message: "Appareil hors ligne depuis plus de 30 minutes (serveur caisse / ERP).",
      deviceUid: "mock-dev-07", siteUid: "mock-site-3", clientId: "mock-client-2",
      createdAt: minutesAgo(now, 8), resolved: false,
    },
    {
      uid: "mock-alert-02", priority: "critical", category: "Espace disque",
      message: "Volume D: — espace libre inférieur à 5 % (3,1 Go restants).",
      deviceUid: "mock-dev-02", siteUid: "mock-site-1", clientId: "mock-client-1",
      createdAt: minutesAgo(now, 22), resolved: false,
    },
    {
      uid: "mock-alert-03", priority: "high", category: "Service",
      message: "Service « Spouleur d'impression » arrêté.",
      deviceUid: "mock-dev-01", siteUid: "mock-site-1", clientId: "mock-client-1",
      createdAt: minutesAgo(now, 41), resolved: false,
    },
    {
      uid: "mock-alert-04", priority: "high", category: "Antivirus",
      message: "Protection antivirus inactive.",
      deviceUid: "mock-dev-04", siteUid: "mock-site-1", clientId: "mock-client-1",
      createdAt: minutesAgo(now, 95), resolved: false,
    },
    {
      uid: "mock-alert-05", priority: "moderate", category: "Correctifs",
      message: "Échec de l'installation de 2 correctifs.",
      deviceUid: "mock-dev-04", siteUid: "mock-site-1", clientId: "mock-client-1",
      createdAt: minutesAgo(now, 180), resolved: false,
    },
    {
      uid: "mock-alert-06", priority: "moderate", category: "Performance",
      message: "Utilisation CPU supérieure à 90 % pendant 15 minutes.",
      deviceUid: "mock-dev-10", siteUid: "mock-site-5", clientId: "mock-client-3",
      createdAt: minutesAgo(now, 260), resolved: false,
    },
    {
      uid: "mock-alert-07", priority: "low", category: "Redémarrage",
      message: "Redémarrage en attente après mises à jour.",
      deviceUid: "mock-dev-05", siteUid: "mock-site-2", clientId: "mock-client-1",
      createdAt: minutesAgo(now, 400), resolved: false,
    },
    {
      uid: "mock-alert-08", priority: "information", category: "Logiciel",
      message: "Nouveau logiciel détecté : « Lecteur PDF ».",
      deviceUid: "mock-dev-08", siteUid: "mock-site-3", clientId: "mock-client-2",
      createdAt: minutesAgo(now, 720), resolved: false,
    },
    {
      uid: "mock-alert-09", priority: "critical", category: "Disponibilité",
      message: "Appareil hors ligne (résolu automatiquement au retour en ligne).",
      deviceUid: "mock-dev-09", siteUid: "mock-site-4", clientId: "mock-client-2",
      createdAt: minutesAgo(now, 1500), resolved: true,
    },
  ];
}
