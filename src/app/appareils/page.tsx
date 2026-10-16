import type { Metadata } from "next";
import { LinkCard, SectionTitle } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { SearchBar } from "@/components/SearchBar";
import { getDattoProvider } from "@/lib/datto";

export const metadata: Metadata = { title: "Appareils" };

export default async function DevicesPage() {
  const provider = getDattoProvider();
  const [clients, sites, devices] = await Promise.all([
    provider.listClients(),
    provider.listSites(),
    provider.listDevices(),
  ]);

  const statsBySite = new Map<string, { total: number; offline: number }>();
  for (const d of devices) {
    const s = statsBySite.get(d.siteUid) ?? { total: 0, offline: 0 };
    s.total += 1;
    if (!d.online) s.offline += 1;
    statsBySite.set(d.siteUid, s);
  }

  return (
    <>
      <PageHeader title="Clients & sites" />
      <SearchBar />
      {clients.map((client) => (
        <section key={client.id}>
          <SectionTitle>{client.name}</SectionTitle>
          <ul className="space-y-2 px-4">
            {sites
              .filter((s) => s.clientId === client.id)
              .map((site) => {
                const stats = statsBySite.get(site.uid) ?? { total: 0, offline: 0 };
                return (
                  <li key={site.uid}>
                    <LinkCard
                      href={`/appareils/sites/${site.uid}`}
                      accent={stats.offline > 0 ? "border-l-critical" : "border-l-ok"}
                    >
                      <p className="truncate font-semibold">{site.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {stats.total} appareil{stats.total > 1 ? "s" : ""}
                        {stats.offline > 0 && (
                          <span className="ml-2 font-semibold text-critical">{stats.offline} hors ligne</span>
                        )}
                      </p>
                    </LinkCard>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}
