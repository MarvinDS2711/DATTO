#!/usr/bin/env node
/**
 * Diagnostic de connexion à l'API Datto RMM — LECTURE SEULE.
 *
 * Usage : npm run datto:check   (lit .env.local)
 *
 * Vérifie le jeton OAuth puis lit la première page des sites, appareils et
 * alertes ouvertes. N'affiche JAMAIS de valeurs (ni noms de clients, ni
 * secrets) : seulement des compteurs et la liste des NOMS de champs reçus,
 * pour pouvoir ajuster la conversion des données sans exposer quoi que ce soit.
 */
const { DATTO_API_URL, DATTO_API_KEY, DATTO_API_SECRET } = process.env;
const timeoutMs = Number(process.env.DATTO_TIMEOUT_MS) || 15000;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!DATTO_API_URL || !DATTO_API_KEY || !DATTO_API_SECRET) {
  fail("DATTO_API_URL, DATTO_API_KEY et DATTO_API_SECRET doivent être définis dans .env.local");
}

let base;
try {
  base = new URL(DATTO_API_URL);
} catch {
  fail("DATTO_API_URL n'est pas une URL valide (forme attendue : https://<plateforme>-api.centrastage.net)");
}
if (base.protocol !== "https:") fail("DATTO_API_URL doit commencer par https://");
console.log(`→ Plateforme : ${base.origin}`);

async function call(url, init) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    fail(`Connexion impossible à ${base.origin} (${error?.name === "TimeoutError" ? "délai dépassé" : error?.message})`);
  }
}

const tokenRes = await call(new URL("/auth/oauth/token", base), {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from("public-client:public").toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  body: new URLSearchParams({ grant_type: "password", username: DATTO_API_KEY, password: DATTO_API_SECRET }),
});
if (!tokenRes.ok) {
  fail(
    `Jeton refusé (HTTP ${tokenRes.status}). Vérifiez la clé/le secret, que l'accès API est activé ` +
      "et que l'URL correspond bien à votre plateforme.",
  );
}
const token = await tokenRes.json();
if (typeof token.access_token !== "string") fail("Réponse de jeton inattendue (pas de access_token).");
console.log(`✓ Jeton OAuth obtenu (expire dans ${token.expires_in ?? "?"} s)`);

/** Noms de champs (récursif sur 1 niveau d'objets imbriqués), sans aucune valeur. */
function shape(item) {
  if (!item || typeof item !== "object") return [];
  return Object.entries(item).map(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? `${k}{${Object.keys(v).join(",")}}` : k,
  );
}

let ok = true;
for (const [label, path, key] of [
  ["Sites", "/api/v2/account/sites", "sites"],
  ["Appareils", "/api/v2/account/devices", "devices"],
  ["Alertes ouvertes", "/api/v2/account/alerts/open", "alerts"],
]) {
  const res = await call(new URL(path, base), {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    ok = false;
    console.error(`✗ ${label} : HTTP ${res.status}`);
    continue;
  }
  const json = await res.json();
  const items = Array.isArray(json[key]) ? json[key] : null;
  if (!items) {
    ok = false;
    console.error(`✗ ${label} : clé « ${key} » absente. Clés reçues : ${Object.keys(json).join(", ")}`);
    continue;
  }
  const more = json.pageDetails?.nextPageUrl ? " (+ pages suivantes)" : "";
  console.log(`✓ ${label} : ${items.length} sur la 1re page${more}`);
  if (items[0]) console.log(`    champs : ${shape(items[0]).join(", ")}`);
}

console.log(ok ? "\nConnexion en lecture seule opérationnelle." : "\nCertaines lectures ont échoué (voir ci-dessus).");
process.exit(ok ? 0 : 1);
