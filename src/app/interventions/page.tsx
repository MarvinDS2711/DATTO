import type { Metadata } from "next";
import { Card, EmptyState, SectionTitle } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { listInterventions, type InterventionRisk, type InterventionStatus } from "@/lib/interventions/catalog";

export const metadata: Metadata = { title: "Interventions" };

const STATUS_LABEL: Record<InterventionStatus, { text: string; className: string }> = {
  disabled: { text: "Désactivée", className: "bg-surface-2 text-muted" },
  simulated: { text: "Simulation", className: "bg-moderate text-black" },
  enabled: { text: "Active", className: "bg-ok text-black" },
};

const RISK_LABEL: Record<InterventionRisk, string> = {
  low: "Risque faible",
  medium: "Risque modéré",
  high: "Risque élevé",
};

export default function InterventionsPage() {
  const actions = listInterventions();
  return (
    <>
      <PageHeader title="Interventions" />
      <div className="px-4">
        <Card className="border-moderate/40">
          <p className="text-sm">
            <strong>Phase 1 :</strong> aucune intervention n&apos;est exécutable. Le catalogue ci-dessous décrit les
            actions prédéfinies prévues ; chacune sera activée uniquement après vérification avec la documentation
            officielle Datto RMM et un accès autorisé. Aucune commande libre (PowerShell) ne sera jamais acceptée.
          </p>
        </Card>
      </div>

      <SectionTitle>Catalogue</SectionTitle>
      <ul className="space-y-2 px-4">
        {actions.map((a) => (
          <li key={a.id}>
            <Card>
              <div className="flex items-start gap-2">
                <p className="flex-1 font-semibold">{a.label}</p>
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_LABEL[a.status].className}`}>
                  {STATUS_LABEL[a.status].text}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{a.description}</p>
              <p className="mt-2 text-xs text-muted">
                {RISK_LABEL[a.risk]}
                {a.requiresConfirmation && " · confirmation obligatoire"}
              </p>
            </Card>
          </li>
        ))}
      </ul>

      <SectionTitle>Tâches en cours et historique</SectionTitle>
      <EmptyState>Aucune tâche — aucune intervention n&apos;a été exécutée.</EmptyState>
    </>
  );
}
