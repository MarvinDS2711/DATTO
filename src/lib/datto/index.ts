import "server-only";
import { getServerEnv } from "@/lib/config/env";
import { HttpDattoProvider } from "./http-provider";
import { MockDattoProvider } from "./mock-provider";
import type { DattoProvider } from "./types";

let provider: DattoProvider | undefined;

/** Point d'entrée unique côté serveur pour accéder aux données Datto. */
export function getDattoProvider(): DattoProvider {
  if (provider) return provider;
  const env = getServerEnv();
  provider =
    env.DATTO_MODE === "datto"
      ? new HttpDattoProvider({
          apiUrl: env.DATTO_API_URL!,
          apiKey: env.DATTO_API_KEY!,
          apiSecret: env.DATTO_API_SECRET!,
          timeoutMs: env.DATTO_TIMEOUT_MS,
        })
      : new MockDattoProvider();
  return provider;
}

export * from "./types";
export * from "./errors";
