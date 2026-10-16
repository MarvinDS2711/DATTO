import type { InterventionId } from "@/lib/interventions/catalog";

/**
 * Modèle de permissions. Vérifié côté serveur pour chaque opération.
 * PHASE 1 : l'authentification n'est pas encore implémentée ; l'utilisateur
 * courant est un utilisateur de démonstration en lecture seule.
 */
export type Role = "viewer" | "technician" | "admin";

export type Permission = "read" | `intervention:${InterventionId}`;

const ROLE_PERMISSIONS: Record<Role, (p: Permission) => boolean> = {
  viewer: (p) => p === "read",
  technician: (p) => p === "read" || (p.startsWith("intervention:") && p !== "intervention:ad.password-reset"),
  admin: () => true,
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role](permission);
}

export interface CurrentUser {
  id: string;
  displayName: string;
  role: Role;
  isDemo: boolean;
}

/** Utilisateur de démonstration (phase 1) — lecture seule. */
export async function getCurrentUser(): Promise<CurrentUser> {
  return { id: "mock-user", displayName: "Technicien de démonstration", role: "viewer", isDemo: true };
}
