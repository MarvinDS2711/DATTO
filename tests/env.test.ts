import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/config/env";

describe("parseEnv", () => {
  it("utilise le mode fictif par défaut", () => {
    expect(parseEnv({}).DATTO_MODE).toBe("mock");
  });

  it("exige les secrets serveur en mode datto", () => {
    expect(() => parseEnv({ DATTO_MODE: "datto" })).toThrow(/DATTO_API_KEY/);
  });

  it("n'inclut jamais la valeur des secrets dans le message d'erreur", () => {
    const secret = "valeur-tres-secrete";
    try {
      parseEnv({ DATTO_MODE: "datto", DATTO_API_SECRET: secret, SESSION_SECRET: "court" });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain(secret);
      expect(String(error)).not.toContain("court");
    }
  });

  it("accepte une configuration datto complète", () => {
    const env = parseEnv({
      DATTO_MODE: "datto",
      DATTO_API_URL: "https://exemple.invalid",
      DATTO_API_KEY: "k",
      DATTO_API_SECRET: "s",
      SESSION_SECRET: "x".repeat(32),
    });
    expect(env.DATTO_TIMEOUT_MS).toBe(15000);
  });
});
