import type { Metadata } from "next";
import { EmptyState, LinkCard, SectionTitle } from "@/components/Card";
import { DeviceCard } from "@/components/DeviceCard";
import { PageHeader } from "@/components/PageHeader";
import { SearchBar } from "@/components/SearchBar";
import { getDattoProvider } from "@/lib/datto";

export const metadata: Metadata = { title: "Recherche" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 100) ?? "";
  const provider = getDattoProvider();
  const [results, clients] = await Promise.all([provider.search(q), provider.listClients()]);
  const clientNames = new Map(clients.map((c) => [c.id, c.name]));
  const total = results.clients.length + results.sites.length + results.devices.length;

  return (
    <>
      <PageHeader title="Recherche" back="/" />
      <SearchBar defaultValue={q} autoFocus={!q} />
      {q.trim().length < 2 ? (
        <EmptyState>Saisissez au moins 2 caractères.</EmptyState>
      ) : total === 0 ? (
        <EmptyState>Aucun résultat pour « {q} ».</EmptyState>
      ) : (
        <>
          {results.clients.length > 0 && (
            <>
              <SectionTitle>Clients</SectionTitle>
              <ul className="space-y-2 px-4">
                {results.clients.map((c) => (
                  <li key={c.id}>
                    <LinkCard href={`/alertes?clientId=${encodeURIComponent(c.id)}`}>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted">Voir les alertes du client</p>
                    </LinkCard>
                  </li>
                ))}
              </ul>
            </>
          )}
          {results.sites.length > 0 && (
            <>
              <SectionTitle>Sites</SectionTitle>
              <ul className="space-y-2 px-4">
                {results.sites.map((s) => (
                  <li key={s.uid}>
                    <LinkCard href={`/appareils/sites/${s.uid}`}>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted">{clientNames.get(s.clientId)}</p>
                    </LinkCard>
                  </li>
                ))}
              </ul>
            </>
          )}
          {results.devices.length > 0 && (
            <>
              <SectionTitle>Machines</SectionTitle>
              <ul className="space-y-2 px-4">
                {results.devices.map((d) => (
                  <li key={d.uid}>
                    <DeviceCard device={d} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}
