import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { DeviceCard } from "@/components/DeviceCard";
import { PageHeader } from "@/components/PageHeader";
import { PriorityBadge } from "@/components/StatusBadge";
import { getDattoProvider } from "@/lib/datto";
import { formatDateTime, formatRelative } from "@/lib/utils/format";

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = getDattoProvider();
  const alert = await provider.getAlert(id);
  if (!alert) notFound();
  const [device, site, client] = await Promise.all([
    provider.getDevice(alert.deviceUid),
    provider.getSite(alert.siteUid),
    provider.getClient(alert.clientId),
  ]);

  return (
    <>
      <PageHeader title="Alerte" back="/alertes" />
      <div className="space-y-3 px-4">
        <Card>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={alert.priority} />
            <span className="text-sm text-muted">{alert.category}</span>
          </div>
          <p className="mt-3 text-lg leading-snug font-medium">{alert.message}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Déclenchée</dt>
            <dd>
              {formatDateTime(alert.createdAt)} ({formatRelative(alert.createdAt)})
            </dd>
            <dt className="text-muted">Client</dt>
            <dd>{client?.name ?? "—"}</dd>
            <dt className="text-muted">Site</dt>
            <dd>
              {site ? (
                <Link href={`/appareils/sites/${site.uid}`} className="text-accent">
                  {site.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-muted">État</dt>
            <dd className={alert.resolved ? "text-ok" : "text-high"}>{alert.resolved ? "Résolue" : "Ouverte"}</dd>
          </dl>
        </Card>

        {device && <DeviceCard device={device} />}

        <Card>
          <h2 className="text-sm font-semibold text-muted uppercase">Actions</h2>
          <button
            type="button"
            disabled
            className="mt-3 min-h-12 w-full rounded-xl border border-border font-semibold text-muted opacity-60"
          >
            Résoudre l&apos;alerte — non disponible
          </button>
          <p className="mt-2 text-xs text-muted">
            La résolution d&apos;alerte sera activée uniquement après vérification dans la documentation officielle de
            l&apos;API Datto RMM et tests avec un accès autorisé.
          </p>
        </Card>
      </div>
    </>
  );
}
