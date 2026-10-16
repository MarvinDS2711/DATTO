import "server-only";
import { getServerEnv } from "@/lib/config/env";
import { HttpDattoProvider } from "./http-provider";
import { MockDattoProvider } from "./mock-provider";
import type { DattoProvider } from "./types";

// Stocké sur globalThis : Next peut charger ce module dans plusieurs contextes,
// or le jeton OAuth et le cache doivent être partagés (limites de débit Datto).
const globalForDatto = globalThis as typeof globalThis & { __dattoProvider?: DattoProvider };

/** Point d'entrée unique côté serveur pour accéder aux données Datto. */
export function getDattoProvider(): DattoProvider {
  if (globalForDatto.__dattoProvider) return globalForDatto.__dattoProvider;
  const env = getServerEnv();
  const provider =
    env.DATTO_MODE === "datto"
      ? new HttpDattoProvider({
          apiUrl: env.DATTO_API_URL!,
          apiKey: env.DATTO_API_KEY!,
          apiSecret: env.DATTO_API_SECRET!,
          timeoutMs: env.DATTO_TIMEOUT_MS,
        })
      : new MockDattoProvider();
  globalForDatto.__dattoProvider = provider;
  return provider;
}

export * from "./types";
export * from "./errors";
