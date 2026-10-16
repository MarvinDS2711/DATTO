import { describe, expect, it } from "vitest";
import { MockDattoProvider } from "@/lib/datto/mock-provider";
import { mockClients } from "@/mocks/data";

const now = new Date("2026-01-15T03:00:00Z");
const provider = new MockDattoProvider(() => now);

describe("MockDattoProvider", () => {
  it("se déclare comme source fictive", () => {
    expect(provider.source).toBe("mock");
  });

  it("identifie clairement toutes les données comme fictives", async () => {
    const [clients, sites, devices, alerts] = await Promise.all([
      provider.listClients(),
      provider.listSites(),
      provider.listDevices(),
      provider.listAlerts({ includeResolved: true }),
    ]);
    expect(clients.every((c) => c.id.startsWith("mock-") && c.name.startsWith("Démo"))).toBe(true);
    expect(sites.every((s) => s.uid.startsWith("mock-"))).toBe(true);
    expect(devices.every((d) => d.uid.startsWith("mock-"))).toBe(true);
    expect(alerts.every((a) => a.uid.startsWith("mock-"))).toBe(true);
  });

  it("trie les alertes ouvertes par gravité puis par date", async () => {
    const alerts = await provider.listAlerts();
    expect(alerts.every((a) => !a.resolved)).toBe(true);
    expect(alerts[0]?.priority).toBe("critical");
    const critical = alerts.filter((a) => a.priority === "critical");
    expect(critical[0]!.createdAt >= critical[1]!.createdAt).toBe(true);
  });

  it("filtre les alertes par gravité, client et appareil", async () => {
    expect((await provider.listAlerts({ priority: "high" })).every((a) => a.priority === "high")).toBe(true);
    expect((await provider.listAlerts({ clientId: "mock-client-3" })).every((a) => a.clientId === "mock-client-3")).toBe(
      true,
    );
    const byDevice = await provider.listAlerts({ deviceUid: "mock-dev-04" });
    expect(byDevice).toHaveLength(2);
  });

  it("inclut les alertes résolues seulement sur demande", async () => {
    const open = await provider.listAlerts();
    const all = await provider.listAlerts({ includeResolved: true });
    expect(all.length).toBeGreaterThan(open.length);
  });

  it("calcule un résumé cohérent", async () => {
    const summary = await provider.getDashboardSummary();
    const devices = await provider.listDevices();
    expect(summary.devicesTotal).toBe(devices.length);
    expect(summary.devicesOnline + summary.devicesOffline).toBe(summary.devicesTotal);
    expect(summary.criticalAlerts).toBe(2);
  });

  it("filtre les appareils par site", async () => {
    const devices = await provider.listDevices({ siteUid: "mock-site-5" });
    expect(devices.length).toBeGreaterThan(0);
    expect(devices.every((d) => d.siteUid === "mock-site-5")).toBe(true);
  });

  it("recherche sans tenir compte des accents ni de la casse", async () => {
    const results = await provider.search("veterinaire");
    expect(results.clients.map((c) => c.id)).toEqual(["mock-client-3"]);
    expect((await provider.search("dur-dc")).devices.map((d) => d.hostname)).toEqual(["DUR-DC01"]);
  });

  it("ignore les recherches trop courtes", async () => {
    expect(await provider.search("a")).toEqual({ clients: [], sites: [], devices: [] });
  });

  it("retourne null pour un identifiant inconnu", async () => {
    expect(await provider.getDevice("inconnu")).toBeNull();
    expect(await provider.getAlert("inconnu")).toBeNull();
    expect(await provider.getClient(mockClients[0]!.id)).not.toBeNull();
  });
});
