import { afterEach, describe, expect, it, vi } from "vitest";
import { DattoNotImplementedError, DattoTimeoutError } from "@/lib/datto/errors";
import { HttpDattoProvider } from "@/lib/datto/http-provider";
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout";

describe("HttpDattoProvider (phase 1)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("n'émet aucune requête réseau et signale que rien n'est implémenté", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = new HttpDattoProvider({
      apiUrl: "https://exemple.invalid",
      apiKey: "cle-de-test",
      apiSecret: "secret-de-test",
      timeoutMs: 1000,
    });
    await expect(provider.listAlerts()).rejects.toBeInstanceOf(DattoNotImplementedError);
    await expect(provider.getDashboardSummary()).rejects.toBeInstanceOf(DattoNotImplementedError);
    expect(fetchSpy).not.toHaveBeenCalled();
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
