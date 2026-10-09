# Astreinte RMM — tableau de bord mobile Datto RMM

Application web responsive (PWA) destinée aux techniciens d'astreinte pour superviser
les clients depuis un iPhone, en s'appuyant **exclusivement sur l'API officielle Datto RMM**.

> **État actuel : phase 1 — maquette.**
> Toutes les données affichées sont **fictives** (bandeau jaune « MAQUETTE » sur chaque page).
> L'API Datto RMM **n'est pas connectée** et **aucune action n'est exécutée** sur des machines.
> Aucune fonctionnalité Datto n'est présentée comme opérationnelle.

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

Pour tester sur iPhone en local : `npm run dev -- -H 0.0.0.0`, puis ouvrir `http://<ip-du-poste>:3000`
depuis le téléphone sur le même réseau.

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
      http-provider.ts       Squelette du client API officiel — NON implémenté
      index.ts               getDattoProvider() selon DATTO_MODE
    interventions/           Catalogue d'actions prédéfinies + validation des paramètres
    auth/permissions.ts      Rôles et permissions vérifiés côté serveur
    audit/                   Journal d'audit JSON avec masquage des secrets
    api/respond.ts           Réponses JSON / erreurs sans fuite d'informations internes
    utils/                   fetchWithTimeout, formatage
  mocks/data.ts              Données fictives (ids « mock-* », clients « Démo – … »)
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

- **Authentification de l'application** (aujourd'hui : utilisateur de démonstration en
  lecture seule). Sessions signées/chiffrées (`SESSION_SECRET`), cookies `HttpOnly`,
  `Secure`, `SameSite=Strict`, MFA recommandée, protection CSRF sur les `POST`.
  **Ne pas déployer avec `DATTO_MODE=datto` tant que ce n'est pas fait** : les routes
  `GET /api/*` ne sont pas encore protégées.
- Implémenter `HttpDattoProvider` d'après la documentation officielle Datto RMM
  (jeton OAuth, endpoints, pagination, limites de débit) avec un compte API dédié aux
  droits minimaux, puis tester avec un accès autorisé.
- Correspondance « client » ↔ « site » Datto à confirmer.
- Activer les interventions une par une (statut `enabled`) uniquement après vérification,
  avec écran de confirmation pour redémarrage et modification AD, et suivi du statut des jobs.

## Variables d'environnement

Voir [`.env.example`](./.env.example). Aucune vraie clé n'est versionnée ;
`.env*` (hors `.env.example`) est ignoré par git.

| Variable                  | Rôle                                           |
| ------------------------- | ---------------------------------------------- |
| `DATTO_MODE`              | `mock` (défaut) ou `datto` (non implémenté)    |
| `DATTO_API_URL`           | URL API de la plateforme Datto RMM             |
| `DATTO_API_KEY`           | clé API (serveur uniquement)                   |
| `DATTO_API_SECRET`        | secret API (serveur uniquement)                |
| `DATTO_TIMEOUT_MS`        | délai max d'un appel Datto (défaut 15000)      |
| `SESSION_SECRET`          | secret des sessions, ≥ 32 caractères (phase 2) |
| `SESSION_MAX_AGE_SECONDS` | durée de session (défaut 28800)                |
| `LOG_LEVEL`               | `debug` / `info` / `warn` / `error`            |
