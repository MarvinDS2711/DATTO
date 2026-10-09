import { notFound } from "next/navigation";
import { AlertCard } from "@/components/AlertCard";
import { Card, EmptyState, SectionTitle } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { OnlineBadge } from "@/components/StatusBadge";
import { getDattoProvider } from "@/lib/datto";
import { listInterventions } from "@/lib/interventions/catalog";
import {
  ANTIVIRUS_LABEL,
  DEVICE_TYPE_LABEL,
  PATCH_LABEL,
  formatDateTime,
  formatRelative,
} from "@/lib/utils/format";

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = getDattoProvider();
  const device = await provider.getDevice(id);
  if (!device) notFound();
  const [site, client, alerts] = await Promise.all([
    provider.getSite(device.siteUid),
    provider.getClient(device.clientId),
    provider.listAlerts({ deviceUid: device.uid }),
  ]);
  const deviceActions = listInterventions();

  const rows: [string, string][] = [
    ["Client", client?.name ?? "—"],
    ["Site", site?.name ?? "—"],
    ["Type", DEVICE_TYPE_LABEL[device.type]],
    ["Système", device.operatingSystem],
    ["Dernier contact", `${formatDateTime(device.lastSeen)} (${formatRelative(device.lastSeen)})`],
    ["IP interne", device.internalIp ?? "—"],
    ["Dernier utilisateur", device.lastLoggedInUser ?? "—"],
    ["Antivirus", ANTIVIRUS_LABEL[device.antivirusStatus]],
    ["Correctifs", PATCH_LABEL[device.patchStatus]],
    ["Redémarrage requis", device.rebootRequired ? "Oui" : "Non"],
  ];

  return (
    <>
      <PageHeader title={device.hostname} back={site ? `/appareils/sites/${site.uid}` : "/appareils"} />
      <div className="px-4">
        <Card>
          <div className="flex items-center justify-between">
            <OnlineBadge online={device.online} />
            {device.description && <span className="truncate text-sm text-muted">{device.description}</span>}
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd className="min-w-0 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <SectionTitle>Alertes ouvertes</SectionTitle>
      {alerts.length === 0 ? (
        <EmptyState>Aucune alerte ouverte.</EmptyState>
      ) : (
        <ul className="space-y-2 px-4">
          {alerts.map((a) => (
            <li key={a.uid}>
              <AlertCard alert={a} />
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Interventions</SectionTitle>
      <div className="grid grid-cols-2 gap-2 px-4">
        {deviceActions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled
            title="Désactivée — non implémentée en phase 1"
            className="min-h-14 rounded-xl border border-border bg-surface px-3 text-left text-sm font-medium text-muted opacity-60"
          >
            {action.label}
          </button>
        ))}
      </div>
      <p className="px-4 pt-2 text-xs text-muted">
        Toutes les interventions sont désactivées : aucune action ne peut être envoyée à cet appareil.
      </p>
    </>
  );
}
