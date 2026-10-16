import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth/permissions";
import { getDattoProvider } from "@/lib/datto";

export const metadata: Metadata = { title: "Profil" };

const ROLE_LABEL = { viewer: "Lecture seule", technician: "Technicien", admin: "Administrateur" } as const;

export default async function ProfilePage() {
  const [user, provider] = [await getCurrentUser(), getDattoProvider()];
  return (
    <>
      <PageHeader title="Profil" />
      <div className="space-y-3 px-4">
        <Card>
          <p className="text-lg font-semibold">{user.displayName}</p>
          <p className="text-sm text-muted">{ROLE_LABEL[user.role]}</p>
          {user.isDemo && (
            <p className="mt-2 text-xs text-moderate">
              Utilisateur de démonstration : l&apos;authentification sera mise en place en phase 2.
            </p>
          )}
        </Card>
        <Card>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Source des données</dt>
            <dd className={provider.source === "mock" ? "font-semibold text-moderate" : ""}>
              {provider.source === "mock" ? "Fictives (maquette)" : "API Datto RMM"}
            </dd>
            <dt className="text-muted">Version</dt>
            <dd>0.1.0 — phase 1</dd>
          </dl>
        </Card>
        <button
          type="button"
          disabled
          className="min-h-12 w-full rounded-xl border border-border font-semibold text-muted opacity-60"
        >
          Se déconnecter — non disponible
        </button>
      </div>
    </>
  );
}
