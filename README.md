# Datto — tableau de bord mobile du support (Datto RMM)

Application web responsive (PWA) destinée à toute l'équipe support (y compris pendant les astreintes) pour superviser
les clients depuis un iPhone, en s'appuyant **exclusivement sur l'API officielle Datto RMM**.

> **État actuel : phase 1.**
> - Par défaut (`DATTO_MODE=mock`) : données **fictives** (bandeau jaune « MAQUETTE »).
> - En `DATTO_MODE=datto` : **lecture seule** des sites, appareils et alertes via l'API
>   officielle (bandeau bleu « données réelles »). Implémenté d'après la documentation,
>   **à valider sur un compte réel** — voir « Tester avec la vraie API ».
> - **Aucune action n'est exécutée** sur des machines ni dans Datto : seules des requêtes GET sont envoyées.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript strict
- Tailwind CSS 4 · thème sombre unique (usage nocturne)
- API Routes Next.js côté serveur · validation `zod`
- Vitest + Testing Library · ESLint
- PWA : manifeste + icônes, installable sur l'écran d'accueil (Safari → Partager → « Sur l'écran d'accueil »)
- Pas de base de données

## Installation

Prérequis : Node.js ≥ 20.9.

```bash
npm install
cp .env.example .env.local   # DATTO_MODE=mock par défaut
npm run dev                  # http://localhost:3000
```

| Commande            | Rôle                                   |
| ------------------- | -------------------------------------- |
| `npm run dev`       | serveur de développement               |
| `npm run build`     | build de production                    |
| `npm start`         | sert le build de production            |
| `npm test`          | tests unitaires et composants (Vitest) |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | vérification TypeScript                |
| `npm run datto:check` | diagnostic de connexion Datto (lecture seule) |

Pour tester sur iPhone en local : `npm run dev -- -H 0.0.0.0`, puis ouvrir `http://<ip-du-poste>:3000`
depuis le téléphone sur le même réseau.

## Tester avec la vraie API (lecture seule)

1. **Créer un utilisateur API dédié** dans Datto RMM, avec un rôle aux droits minimaux
   (lecture), puis activer l'accès API (Setup → Global Settings → Access Control) et
   générer sa clé et son secret (fiche utilisateur → API Keys).
2. **Repérer l'URL API de votre plateforme**, affichée au même endroit, de la forme
   `https://<plateforme>-api.centrastage.net`.
3. Dans `.env.local` **sur votre poste** (jamais dans git, jamais dans un chat) :
   ```bash
   DATTO_MODE=datto
   DATTO_API_URL=https://<plateforme>-api.centrastage.net
   DATTO_API_KEY=...
   DATTO_API_SECRET=...
   APP_ACCESS_PASSWORD=...   # au moins 12 caractères, demandé par le navigateur
   ```
4. **Diagnostic** : `npm run datto:check`. Le script obtient un jeton puis lit la première
   page des sites, appareils et alertes. Il n'affiche que des compteurs et les **noms** des
   champs reçus (aucun nom de client, aucune valeur) : vous pouvez copier sa sortie pour
   ajuster la conversion des données.
5. **Lancer l'application** : `npm run dev`, puis http://localhost:3000. Le navigateur
   demande l'identifiant `support` (ou `APP_ACCESS_USER`) et `APP_ACCESS_PASSWORD`.

Précautions :
- Restez sur `localhost` de préférence. Avec `-H 0.0.0.0` (test sur iPhone), le mot de passe
  circule **en clair sur le Wi-Fi** (HTTP) : seulement sur un réseau de confiance.
- Ne déployez pas cette version sur Internet : le contrôle d'accès HTTP Basic est une
  protection provisoire, sans limitation des tentatives. L'authentification complète
  arrive en phase 2.
- Datto RMM n'a pas de niveau « client » au-dessus des sites : en mode réel, **un site = un client**.
- Les listes sont mises en cache 30 s côté serveur (limite Datto : 600 lectures / minute).

## Architecture

```
src/
  app/                       Pages (App Router) et API Routes
    page.tsx                 Accueil : compteurs, dernières alertes, hors ligne, recherche
    alertes/                 Liste filtrable (gravité, client, appareil) + [id] détail
    appareils/               Clients & sites → sites/[uid] → [id] fiche appareil
    interventions/           Catalogue des actions prédéfinies (toutes désactivées)
    profil/                  Utilisateur, source des données
    recherche/               Résultats clients / sites / machines
    api/                     summary, alerts, devices, sites, search, interventions
    manifest.ts, icon.svg, apple-icon.tsx, icon-192/, icon-512/   PWA
  components/                BottomNav, cartes, badges de statut, barre de recherche…
  lib/
    config/env.ts            Variables d'environnement validées, serveur uniquement
    datto/                   Couche d'abstraction Datto
      types.ts               Modèle de domaine + interface DattoProvider
      mock-provider.ts       Données fictives (aucun appel réseau)
      http-provider.ts       Client API officiel v2, lecture seule (OAuth, pagination, cache)
      mapping.ts             Conversion réponses Datto → modèle de domaine
      query.ts               Filtres, tri, résumé, recherche communs
      index.ts               getDattoProvider() selon DATTO_MODE
    interventions/           Catalogue d'actions prédéfinies + validation des paramètres
    auth/permissions.ts      Rôles et permissions vérifiés côté serveur
    auth/basic-auth.ts       Contrôle d'accès provisoire (mode datto)
    audit/                   Journal d'audit JSON avec masquage des secrets
    api/respond.ts           Réponses JSON / erreurs sans fuite d'informations internes
    utils/                   fetchWithTimeout, formatage
  proxy.ts                   Exige un identifiant dès que DATTO_MODE=datto
  mocks/data.ts              Données fictives (ids « mock-* », clients « Démo – … »)
scripts/datto-check.mjs      Diagnostic de connexion Datto (npm run datto:check)
tests/                       Tests Vitest
```

Les pages et API Routes ne dépendent que de l'interface `DattoProvider`. Passer de la
maquette à l'API réelle consistera à implémenter `HttpDattoProvider`, sans toucher à l'UI.

Les pages sont des Server Components : les données sont lues côté serveur, aucun appel
à Datto n'est possible depuis le navigateur. Les filtres et la recherche sont des
formulaires `GET` qui fonctionnent sans JavaScript client.

## Sécurité (en place dès la phase 1)

- Secrets uniquement côté serveur : aucune variable `NEXT_PUBLIC_`, et les modules
  sensibles importent `server-only` (le build échoue s'ils sont importés côté client).
- En-têtes de sécurité stricts (CSP sans origine tierce, `frame-ancestors 'none'`,
  `no-referrer`, HSTS) ; `Cache-Control: no-store` sur `/api/*`.
- Interventions : **catalogue fermé** d'actions prédéfinies, paramètres validés par
  liste blanche (`.strict()` refuse tout paramètre non prévu). Aucune commande libre.
- `POST /api/interventions` enchaîne : format → intervention connue → permission →
  paramètres → confirmation explicite → **501, rien n'est exécuté** (`executed: false`).
- Journal d'audit JSON ; les clés évoquant un secret (`password`, `token`, `apiKey`…) sont masquées.
- Délais d'expiration (`fetchWithTimeout`) prêts pour les appels Datto.

### À faire avant toute connexion réelle (phase 2)

- **Authentification de l'application** (aujourd'hui : HTTP Basic provisoire en mode
  datto). Sessions signées/chiffrées (`SESSION_SECRET`), cookies `HttpOnly`, `Secure`,
  `SameSite=Strict`, MFA recommandée, limitation des tentatives, protection CSRF sur les `POST`.
  **Ne pas déployer sur Internet tant que ce n'est pas fait.**
- Valider la lecture seule sur un compte réel (`npm run datto:check`) et ajuster la
  conversion des champs si besoin.
- Correspondance « client » ↔ « site » Datto à confirmer.
- Activer les interventions une par une (statut `enabled`) uniquement après vérification,
  avec écran de confirmation pour redémarrage et modification AD, et suivi du statut des jobs.

## Variables d'environnement

Voir [`.env.example`](./.env.example). Aucune vraie clé n'est versionnée ;
`.env*` (hors `.env.example`) est ignoré par git.

| Variable                  | Rôle                                           |
| ------------------------- | ---------------------------------------------- |
| `DATTO_MODE`              | `mock` (défaut) ou `datto` (lecture seule)     |
| `DATTO_API_URL`           | URL API de la plateforme Datto RMM             |
| `DATTO_API_KEY`           | clé API (serveur uniquement)                   |
| `DATTO_API_SECRET`        | secret API (serveur uniquement)                |
| `DATTO_TIMEOUT_MS`        | délai max d'un appel Datto (défaut 15000)      |
| `APP_ACCESS_USER`         | identifiant d'accès en mode datto (`support`)  |
| `APP_ACCESS_PASSWORD`     | mot de passe d'accès, ≥ 12 car. (mode datto)   |
| `SESSION_SECRET`          | secret des sessions, ≥ 32 caractères (phase 2) |
| `SESSION_MAX_AGE_SECONDS` | durée de session (défaut 28800)                |
| `LOG_LEVEL`               | `debug` / `info` / `warn` / `error`            |
