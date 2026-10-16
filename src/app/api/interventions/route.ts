import { NextResponse } from "next/server";
import { audit } from "@/lib/audit/logger";
import { getCurrentUser } from "@/lib/auth/permissions";
import { listInterventions } from "@/lib/interventions/catalog";
import { evaluateInterventionRequest } from "@/lib/interventions/request";

export async function GET() {
  return NextResponse.json({ data: listInterventions() });
}

/**
 * Point d'entrée unique des interventions. PHASE 1 : valide et journalise la
 * demande, mais n'exécute jamais rien (réponse 501 pour une demande valide).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  const decision = evaluateInterventionRequest(user, body);
  audit({ actor: user.id, ...decision.audit });
  return NextResponse.json(decision.body, { status: decision.httpStatus });
}
