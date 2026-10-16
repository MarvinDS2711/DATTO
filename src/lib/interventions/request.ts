import { z } from "zod";
import { can, type CurrentUser } from "@/lib/auth/permissions";
import { interventionCatalog, isInterventionId, validateInterventionParams } from "./catalog";

const requestSchema = z
  .object({
    interventionId: z.string().min(1).max(64),
    params: z.unknown(),
    confirmed: z.boolean().optional(),
  })
  .strict();

export interface InterventionDecision {
  httpStatus: 400 | 403 | 404 | 422 | 501;
  body: { error: string; details?: string[]; executed: false };
  audit: { action: string; outcome: "rejected" | "not-implemented"; target?: string; details?: Record<string, unknown> };
}

/**
 * Évalue une demande d'intervention : format, existence dans le catalogue,
 * permission, paramètres, confirmation, puis disponibilité.
 *
 * PHASE 1 : aucune issue ne mène à une exécution. Le champ `executed` vaut
 * toujours `false` et le statut final est 501 pour une demande valide.
 */
export function evaluateInterventionRequest(user: CurrentUser, rawBody: unknown): InterventionDecision {
  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      httpStatus: 400,
      body: { error: "Requête invalide.", executed: false },
      audit: { action: "intervention", outcome: "rejected", details: { reason: "invalid-body" } },
    };
  }
  const { interventionId, params, confirmed } = parsed.data;

  if (!isInterventionId(interventionId)) {
    return {
      httpStatus: 404,
      body: { error: "Intervention inconnue.", executed: false },
      audit: { action: "intervention", outcome: "rejected", details: { reason: "unknown-intervention" } },
    };
  }
  const action = `intervention:${interventionId}` as const;

  if (!can(user.role, action)) {
    return {
      httpStatus: 403,
      body: { error: "Permission refusée.", executed: false },
      audit: { action, outcome: "rejected", details: { reason: "forbidden", role: user.role } },
    };
  }

  const validation = validateInterventionParams(interventionId, params);
  if (!validation.ok) {
    return {
      httpStatus: 422,
      body: { error: "Paramètres invalides.", details: validation.errors, executed: false },
      audit: { action, outcome: "rejected", details: { reason: "invalid-params" } },
    };
  }
  const target = validation.params.deviceUid;

  if (interventionCatalog[interventionId].requiresConfirmation && confirmed !== true) {
    return {
      httpStatus: 400,
      body: { error: "Confirmation explicite requise.", executed: false },
      audit: { action, outcome: "rejected", target, details: { reason: "not-confirmed" } },
    };
  }

  return {
    httpStatus: 501,
    body: {
      error: "Intervention désactivée : non implémentée et non vérifiée avec l'API Datto. Aucune action exécutée.",
      executed: false,
    },
    audit: { action, outcome: "not-implemented", target, details: { params: validation.params } },
  };
}
