import { z } from "zod";

/**
 * Catalogue des interventions PRÉDÉFINIES.
 *
 * Il n'existe aucun moyen de soumettre une commande libre (PowerShell ou autre) :
 * seules ces actions, avec des paramètres validés, pourront être exécutées.
 *
 * PHASE 1 : toutes les actions ont le statut "disabled". Aucune n'est exécutée
 * ni simulée côté machine. Une action ne passera à "enabled" qu'après
 * vérification avec la documentation officielle Datto RMM et un accès autorisé.
 */

export type InterventionStatus = "disabled" | "simulated" | "enabled";
export type InterventionRisk = "low" | "medium" | "high";
export type InterventionCategory = "device" | "service" | "active-directory" | "component";

const deviceUid = z.string().min(1).max(64).regex(/^[A-Za-z0-9-]+$/, "Identifiant d'appareil invalide");

/** Nom de service Windows : lettres, chiffres, espace, point, tiret, underscore. */
const serviceName = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9 ._-]+$/, "Nom de service invalide");

/** sAMAccountName : 1 à 20 caractères, sans caractères interdits par AD. */
const samAccountName = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[A-Za-z0-9._-]+$/, "Identifiant AD invalide");

export const interventionCatalog = {
  "device.reboot": {
    label: "Redémarrer l'appareil",
    description: "Redémarrage planifié immédiat de l'appareil.",
    category: "device",
    risk: "high",
    requiresConfirmation: true,
    status: "disabled",
    params: z.object({ deviceUid }).strict(),
  },
  "service.start": {
    label: "Démarrer un service Windows",
    description: "Démarre un service Windows existant.",
    category: "service",
    risk: "medium",
    requiresConfirmation: true,
    status: "disabled",
    params: z.object({ deviceUid, serviceName }).strict(),
  },
  "service.stop": {
    label: "Arrêter un service Windows",
    description: "Arrête un service Windows existant.",
    category: "service",
    risk: "high",
    requiresConfirmation: true,
    status: "disabled",
    params: z.object({ deviceUid, serviceName }).strict(),
  },
  "service.restart": {
    label: "Redémarrer un service Windows",
    description: "Redémarre un service Windows existant.",
    category: "service",
    risk: "medium",
    requiresConfirmation: true,
    status: "disabled",
    params: z.object({ deviceUid, serviceName }).strict(),
  },
  "ad.password-reset": {
    label: "Réinitialiser un mot de passe AD",
    description:
      "Réinitialisation via un composant Datto dédié exécuté sur un contrôleur de domaine. Le mot de passe n'est jamais journalisé.",
    category: "active-directory",
    risk: "high",
    requiresConfirmation: true,
    status: "disabled",
    params: z
      .object({
        deviceUid,
        samAccountName,
        mustChangeAtNextLogon: z.boolean().default(true),
      })
      .strict(),
  },
  "component.quick-job": {
    label: "Lancer un composant (Quick Job)",
    description: "Exécute un composant Datto figurant dans la liste autorisée.",
    category: "component",
    risk: "medium",
    requiresConfirmation: true,
    status: "disabled",
    params: z
      .object({
        deviceUid,
        // Identifiant d'un composant de la liste blanche (à définir en phase 2).
        componentId: z.string().min(1).max(64).regex(/^[A-Za-z0-9-]+$/),
      })
      .strict(),
  },
} as const satisfies Record<
  string,
  {
    label: string;
    description: string;
    category: InterventionCategory;
    risk: InterventionRisk;
    requiresConfirmation: boolean;
    status: InterventionStatus;
    params: z.ZodType;
  }
>;

export type InterventionId = keyof typeof interventionCatalog;

export function isInterventionId(value: string): value is InterventionId {
  return Object.hasOwn(interventionCatalog, value);
}

export type ValidationResult<T> = { ok: true; params: T } | { ok: false; errors: string[] };

export function validateInterventionParams<Id extends InterventionId>(
  id: Id,
  params: unknown,
): ValidationResult<z.infer<(typeof interventionCatalog)[Id]["params"]>> {
  const result = interventionCatalog[id].params.safeParse(params);
  if (result.success) return { ok: true, params: result.data as z.infer<(typeof interventionCatalog)[Id]["params"]> };
  return { ok: false, errors: result.error.issues.map((i) => `${i.path.join(".") || "params"}: ${i.message}`) };
}

export function listInterventions() {
  return (Object.keys(interventionCatalog) as InterventionId[]).map((id) => {
    const { label, description, category, risk, requiresConfirmation, status } = interventionCatalog[id];
    return { id, label, description, category, risk, requiresConfirmation, status };
  });
}
