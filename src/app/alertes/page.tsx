import type { Metadata } from "next";
import { AlertCard } from "@/components/AlertCard";
import { EmptyState } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ALERT_PRIORITIES, getDattoProvider, type AlertPriority } from "@/lib/datto";
import { PRIORITY_LABEL } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Alertes" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value || undefined;
}

const selectClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm";

export default async function AlertsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rawPriority = first(sp.priority);
  const priority = ALERT_PRIORITIES.includes(rawPriority as AlertPriority) ? (rawPriority as AlertPriority) : undefined;
  const clientId = first(sp.clientId);
  const deviceUid = first(sp.deviceUid);
  const includeResolved = first(sp.resolved) === "1";

  const provider = getDattoProvider();
  const [alerts, clients, devices] = await Promise.all([
    provider.listAlerts({ priority, clientId, deviceUid, includeResolved }),
    provider.listClients(),
    provider.listDevices(clientId ? { clientId } : {}),
  ]);
  const hostnames = new Map(devices.map((d) => [d.uid, d.hostname]));

  return (
    <>
      <PageHeader title="Alertes" />
      <form method="get" className="grid grid-cols-2 gap-2 px-4" aria-label="Filtres">
        <select name="priority" defaultValue={priority ?? ""} className={selectClass} aria-label="Gravité">
          <option value="">Toutes gravités</option>
          {ALERT_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <select name="clientId" defaultValue={clientId ?? ""} className={selectClass} aria-label="Client">
          <option value="">Tous clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="deviceUid" defaultValue={deviceUid ?? ""} className={selectClass} aria-label="Appareil">
          <option value="">Tous appareils</option>
          {devices.map((d) => (
            <option key={d.uid} value={d.uid}>
              {d.hostname}
            </option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm">
          <input type="checkbox" name="resolved" value="1" defaultChecked={includeResolved} className="size-4" />
          Résolues
        </label>
        <button type="submit" className="col-span-2 min-h-11 rounded-xl bg-accent font-semibold text-white">
          Filtrer
        </button>
      </form>

      <p className="px-4 pt-4 pb-2 text-sm text-muted">
        {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
      </p>
      {alerts.length === 0 ? (
        <EmptyState>Aucune alerte pour ces filtres.</EmptyState>
      ) : (
        <ul className="space-y-2 px-4">
          {alerts.map((a) => (
            <li key={a.uid}>
              <AlertCard alert={a} hostname={hostnames.get(a.deviceUid)} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
