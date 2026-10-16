import "server-only";
import { z } from "zod";

/**
 * Configuration serveur. Ce module importe `server-only` : toute tentative de
 * l'importer depuis un composant client fait échouer le build, ce qui empêche
 * les secrets Datto d'atteindre le navigateur.
 */
const envSchema = z
  .object({
    DATTO_MODE: z.enum(["mock", "datto"]).default("mock"),
    DATTO_API_URL: z.url().optional().or(z.literal("").transform(() => undefined)),
    DATTO_API_KEY: z.string().optional(),
    DATTO_API_SECRET: z.string().optional(),
    DATTO_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(15000),
    APP_ACCESS_USER: z.string().min(1).default("support"),
    APP_ACCESS_PASSWORD: z.string().optional(),
    SESSION_SECRET: z.string().optional(),
    SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(28800),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  })
  .superRefine((env, ctx) => {
    if (env.DATTO_MODE !== "datto") return;
    for (const key of ["DATTO_API_URL", "DATTO_API_KEY", "DATTO_API_SECRET"] as const) {
      if (!env[key]) {
        ctx.addIssue({ code: "custom", path: [key], message: `${key} est requis quand DATTO_MODE=datto` });
      }
    }
    if (!env.APP_ACCESS_PASSWORD || env.APP_ACCESS_PASSWORD.length < 12) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_ACCESS_PASSWORD"],
        message: "APP_ACCESS_PASSWORD (12 caractères min.) est requis quand DATTO_MODE=datto",
      });
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // On ne journalise que les noms de variables, jamais leurs valeurs.
    const fields = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuration invalide — ${fields}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseEnv(process.env);
  return cached;
}
