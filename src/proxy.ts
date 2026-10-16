import { NextResponse, type NextRequest } from "next/server";
import { checkBasicAuth } from "@/lib/auth/basic-auth";

/**
 * Contrôle d'accès minimal tant que l'authentification complète (phase 2)
 * n'existe pas : dès que l'application affiche de VRAIES données Datto
 * (DATTO_MODE=datto), toute page et toute API exigent un identifiant HTTP Basic.
 * En mode fictif, l'accès reste libre.
 */
export function proxy(request: NextRequest) {
  if (process.env.DATTO_MODE !== "datto") return NextResponse.next();

  const password = process.env.APP_ACCESS_PASSWORD;
  if (!password || password.length < 12) {
    return new NextResponse("Accès bloqué : APP_ACCESS_PASSWORD (12 caractères min.) doit être défini.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const user = process.env.APP_ACCESS_USER || "support";
  if (checkBasicAuth(request.headers.get("authorization"), user, password)) return NextResponse.next();

  return new NextResponse("Authentification requise.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Datto", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  // Les icônes et le manifeste restent publics (requis par l'écran d'accueil iOS).
  matcher: ["/((?!_next/static|_next/image|icon.svg|apple-icon|icon-192|icon-512|manifest.webmanifest).*)"],
};
