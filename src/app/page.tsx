import Link from "next/link";
import { AlertCard } from "@/components/AlertCard";
import { EmptyState, SectionTitle } from "@/components/Card";
import { DeviceCard } from "@/components/DeviceCard";
import { PageHeader } from "@/components/PageHeader";
import { SearchBar } from "@/components/SearchBar";
import { getDattoProvider } from "@/lib/datto";

function Tile({ href, label, value, tone }: { href: string; label: string; value: number; tone: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-surface p-4 active:bg-surface-2">
      <p className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
    </Link>
  );
}

export default async function HomePage() {
  const provider = getDattoProvider();
  const [summary, alerts, devices] = await Promise.all([
    provider.getDashboardSummary(),
    provider.listAlerts(),
    provider.listDevices(),
  ]);
  const hostnames = new Map(devices.map((d) => [d.uid, d.hostname]));
  const offline = devices.filter((d) => !d.online);

  return (
    <>
      <PageHeader title="Datto" />
      <SearchBar />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <Tile
          href="/alertes?priority=critical"
          label="Alertes critiques"
          value={summary.criticalAlerts}
          tone={summary.criticalAlerts > 0 ? "text-critical" : "text-ok"}
        />
        <Tile href="/alertes" label="Avertissements" value={summary.warningAlerts} tone="text-high" />
        <Tile href="/appareils" label="En ligne" value={summary.devicesOnline} tone="text-ok" />
        <Tile
          href="/appareils"
          label="Hors ligne"
          value={summary.devicesOffline}
          tone={summary.devicesOffline > 0 ? "text-critical" : "text-muted"}
        />
      </div>

      <SectionTitle
        action={
          <Link href="/alertes" className="text-sm font-medium text-accent">
            Tout voir
          </Link>
        }
      >
        Dernières alertes
      </SectionTitle>
      {alerts.length === 0 ? (
        <EmptyState>Aucune alerte ouverte.</EmptyState>
      ) : (
        <ul className="space-y-2 px-4">
          {alerts.slice(0, 5).map((a) => (
            <li key={a.uid}>
              <AlertCard alert={a} hostname={hostnames.get(a.deviceUid)} />
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Appareils hors ligne</SectionTitle>
      {offline.length === 0 ? (
        <EmptyState>Tous les appareils sont en ligne.</EmptyState>
      ) : (
        <ul className="space-y-2 px-4">
          {offline.map((d) => (
            <li key={d.uid}>
              <DeviceCard device={d} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
