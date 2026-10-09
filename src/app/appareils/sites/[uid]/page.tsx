import { notFound } from "next/navigation";
import { EmptyState } from "@/components/Card";
import { DeviceCard } from "@/components/DeviceCard";
import { PageHeader } from "@/components/PageHeader";
import { getDattoProvider } from "@/lib/datto";

export default async function SitePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const provider = getDattoProvider();
  const site = await provider.getSite(uid);
  if (!site) notFound();
  const [client, devices] = await Promise.all([provider.getClient(site.clientId), provider.listDevices({ siteUid: uid })]);
  // Hors ligne d'abord : ce sont eux qui nécessitent une attention en priorité.
  const sorted = [...devices].sort((a, b) => Number(a.online) - Number(b.online) || a.hostname.localeCompare(b.hostname));

  return (
    <>
      <PageHeader title={site.name} back="/appareils" />
      <p className="-mt-2 px-4 pb-3 text-sm text-muted">{client?.name}</p>
      {sorted.length === 0 ? (
        <EmptyState>Aucun appareil sur ce site.</EmptyState>
      ) : (
        <ul className="space-y-2 px-4">
          {sorted.map((d) => (
            <li key={d.uid}>
              <DeviceCard device={d} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
