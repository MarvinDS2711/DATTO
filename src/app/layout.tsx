import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { MockBanner } from "@/components/MockBanner";
import { getDattoProvider } from "@/lib/datto";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Datto", template: "%s · Datto" },
  description: "Supervision et administration mobile du support via l'API Datto RMM.",
  applicationName: "Datto",
  appleWebApp: { capable: true, title: "Datto", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0f17",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const provider = getDattoProvider();
  let criticalCount = 0;
  try {
    criticalCount = (await provider.getDashboardSummary()).criticalAlerts;
  } catch {
    // Le badge est facultatif : une erreur sera affichée par la page elle-même.
  }

  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">
        {provider.source === "mock" && <MockBanner />}
        <main className="mx-auto max-w-xl pb-28">{children}</main>
        <BottomNav criticalCount={criticalCount} />
      </body>
    </html>
  );
}
