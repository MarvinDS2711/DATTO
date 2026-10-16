import "server-only";
import { redact } from "./redact";

export interface AuditEvent {
  action: string;
  actor: string;
  outcome: "rejected" | "not-implemented" | "simulated" | "success" | "failure";
  target?: string;
  details?: Record<string, unknown>;
}

/**
 * Journal d'audit des opérations. Sortie JSON sur stdout (collectée par
 * l'hébergeur). Les détails passent systématiquement par `redact`.
 */
export function audit(event: AuditEvent): void {
  const entry = {
    type: "audit",
    at: new Date().toISOString(),
    ...event,
    details: event.details ? redact(event.details) : undefined,
  };
  console.info(JSON.stringify(entry));
}
