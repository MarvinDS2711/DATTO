import { describe, expect, it } from "vitest";
import { DattoHttpError, DattoTimeoutError } from "@/lib/datto/errors";
import { HttpDattoProvider } from "@/lib/datto/http-provider";
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout";

const API = "https://exemple-api.invalid";

interface Call {
  method: string;
  url: string;
  auth: string | null;
}

/** Faux serveur Datto : répond à partir d'une table de routes, journalise les appels. */
function fakeDatto(routes: Record<string, unknown>, options: { tokenStatus?: number; failFirstGetWith401?: boolean } = {}) {
  const calls: Call[] = [];
  let failed = false;
  const impl: typeof fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ method: init?.method ?? "GET", url, auth: headers.get("authorization") });
    if (url === `${API}/auth/oauth/token`) {
      if (options.tokenStatus) return new Response("{}", { status: options.tokenStatus });
      return Response.json({ access_token: "jeton-test", expires_in: 360000 });
    }
    if (options.failFirstGetWith401 && !failed) {
      failed = true;
      return new Response("", { status: 401 });
    }
    const path = url.slice(API.length);
    if (path in routes) return Response.json(routes[path]);
    return new Response("", { status: 404 });
  };
  return { impl, calls };
}

const rawDevice = {
  uid: "dev-1",
  siteUid: "site-1",
  siteName: "Client A",
  hostname: "SRV01",
  deviceType: { category: "Server", type: "Main System Chassis" },
  operatingSystem: "Microsoft Windows Server 2022",
  online: true,
  lastSeen: 1760000000000,
  intIpAddress: "10.0.0.5",
  rebootRequired: false,
  antivirus: { antivirusProduct: "X", antivirusStatus: "RunningAndUpToDate" },
  patchManagement: { patchStatus: "FullyPatched" },
};

const routes = {
  "/api/v2/account/sites": {
    pageDetails: { nextPageUrl: `${API}/api/v2/account/sites?page=1` },
    sites: [{ uid: "site-1", name: "Client A" }],
  },
  "/api/v2/account/sites?page=1": { pageDetails: { nextPageUrl: null }, sites: [{ uid: "site-2", name: "Client B" }] },
  "/api/v2/account/devices": {
    pageDetails: {},
    devices: [rawDevice, { ...rawDevice, uid: "dev-2", siteUid: "site-2", hostname: "PC01", online: false }],
  },
  "/api/v2/account/alerts/open": {
    pageDetails: {},
    alerts: [
      {
        alertUid: "al-1",
        priority: "Critical",
        diagnostics: "Disque plein",
        resolved: false,
        timestamp: 1760000000000,
        alertContext: { "@class": "perf_disk_usage_ctx" },
        alertSourceInfo: { deviceUid: "dev-1", deviceName: "SRV01", siteUid: "site-1", siteName: "Client A" },
      },
    ],
  },
};

function provider(fetchImpl: typeof fetch) {
  return new HttpDattoProvider({ apiUrl: API, apiKey: "cle", apiSecret: "secret", timeoutMs: 1000, fetchImpl });
}

describe("HttpDattoProvider", () => {
  it("obtient un jeton OAuth puis lit sites, appareils et alertes", async () => {
    const { impl, calls } = fakeDatto(routes);
    const p = provider(impl);
    const [sites, devices, alerts, summary] = await Promise.all([
      p.listSites(),
      p.listDevices(),
      p.listAlerts(),
      p.getDashboardSummary(),
    ]);
    expect(sites.map((s) => s.name)).toEqual(["Client A", "Client B"]);
    expect(devices[0]).toMatchObject({ hostname: "SRV01", type: "server", online: true, antivirusStatus: "running" });
    expect(alerts[0]).toMatchObject({ uid: "al-1", priority: "critical", deviceUid: "dev-1", category: "Perf disk usage" });
    expect(summary).toMatchObject({ criticalAlerts: 1, devicesOnline: 1, devicesOffline: 1 });

    // Un seul jeton demandé, même avec des appels parallèles.
    expect(calls.filter((c) => c.url.endsWith("/auth/oauth/token"))).toHaveLength(1);
    const token = calls.find((c) => c.url.endsWith("/auth/oauth/token"))!;
    expect(token.auth).toBe(`Basic ${Buffer.from("public-client:public").toString("base64")}`);
    expect(calls.filter((c) => c.url.includes("/api/v2/")).every((c) => c.auth === "Bearer jeton-test")).toBe(true);
  });

  it("n'envoie que des GET vers l'API (lecture seule)", async () => {
    const { impl, calls } = fakeDatto(routes);
    const p = provider(impl);
    await p.listAlerts({ includeResolved: true });
    await p.search("srv");
    await p.getAlert("inconnue");
    const apiCalls = calls.filter((c) => !c.url.endsWith("/auth/oauth/token"));
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls.every((c) => c.method === "GET")).toBe(true);
  });

  it("met les listes en cache pour limiter les appels", async () => {
    const { impl, calls } = fakeDatto(routes);
    const p = provider(impl);
    await p.listDevices();
    await p.listDevices({ siteUid: "site-1" });
    await p.getDevice("dev-2");
    expect(calls.filter((c) => c.url.endsWith("/api/v2/account/devices"))).toHaveLength(1);
  });

  it("redemande un jeton une fois si l'API répond 401", async () => {
    const { impl, calls } = fakeDatto(routes, { failFirstGetWith401: true });
    const devices = await provider(impl).listDevices();
    expect(devices).toHaveLength(2);
    expect(calls.filter((c) => c.url.endsWith("/auth/oauth/token"))).toHaveLength(2);
  });

  it("signale une clé refusée sans exposer le secret", async () => {
    const { impl } = fakeDatto(routes, { tokenStatus: 401 });
    const error = await provider(impl).listSites().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DattoHttpError);
    expect(String(error)).toMatch(/clé et le secret/);
    expect(String(error)).not.toContain("secret\"");
  });

  it("refuse de suivre une pagination vers un autre hôte (pas de fuite du jeton)", async () => {
    const { impl, calls } = fakeDatto({
      "/api/v2/account/sites": { pageDetails: { nextPageUrl: "https://pirate.invalid/x" }, sites: [] },
    });
    await expect(provider(impl).listSites()).rejects.toThrow(/hors de l'API/);
    expect(calls.some((c) => c.url.startsWith("https://pirate.invalid"))).toBe(false);
  });
});

describe("fetchWithTimeout", () => {
  it("lève DattoTimeoutError quand le délai est dépassé", async () => {
    const neverResolves: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    await expect(fetchWithTimeout("https://exemple.invalid", { timeoutMs: 10 }, neverResolves)).rejects.toBeInstanceOf(
      DattoTimeoutError,
    );
  });

  it("retourne la réponse quand elle arrive à temps", async () => {
    const ok: typeof fetch = async () => new Response("ok", { status: 200 });
    const res = await fetchWithTimeout("https://exemple.invalid", { timeoutMs: 1000 }, ok);
    expect(res.status).toBe(200);
  });
});
