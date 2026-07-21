# Unlocking London

A premium, iOS-only curated guide to the best of London - restaurants, cafés, brunch and activities. The heart of the app is a beautiful Apple map that plots Unlocking London's curated places around you, with editorial reviews as the soul.

This is the v1 local build: full stack end-to-end (CMS to API to app), premium from the first screen.

```
unlocking_london/
  mobile/     Expo iOS app (expo-router, Liquid Glass, Apple Maps). Talks ONLY to backend.
  backend/    NestJS BFF gateway - fronts Directus; the app's single point of contact.
  tools/      Maintenance scripts. tools/directus = Directus schema bootstrap + seed (its IaC).
  data/       Canonical seed JSON (catalog.json) - single source of truth for seeded places.
  terraform/  Railway + Cloudflare R2 IaC (deploy).
  postman/    API collection mirroring the backend routes.
  docs/       INFRASTRUCTURE.md - deployment-topology source of truth.
  docker-compose.yml   Local Postgres + Directus.
```

Architecture: `mobile  ->  backend (BFF)  ->  directus  ->  postgres`. The app never
talks to Directus directly; the BFF adds custom endpoints (Apple auth exchange,
aggregated feeds, and later Plans/swipe) and keeps Directus + the R2 bucket
private. Content shapes are normalized server-side; see `backend/API_CONTRACT.md`.
Repo conventions (incl. the Postman + INFRASTRUCTURE keep-in-sync contracts): `CLAUDE.md`.

## Prerequisites

- Docker + Docker Compose
- Node 20+ (repo tested on 24)
- Xcode 26 + an iPhone/simulator on iOS 18+ (Liquid Glass activates on iOS 26)
- An Apple Developer account for Sign in with Apple (device testing)

## 1. CMS + database (Docker)

```bash
docker compose up -d            # Postgres + Directus (dev values inlined in the compose file)
# wait until http://localhost:8055 is up
cd tools/directus
npm install
npm run setup                   # provisions the Directus schema + roles, then seeds London places from data/catalog.json
```

Admin panel: `http://localhost:8055` (`admin@unlockinglondon.com` / `admin-dev-pw`).

## 2. Backend (NestJS BFF gateway)

The app's single point of contact. Holds a cached Directus admin session for
public reads and forwards the user's Bearer for per-user calls.

```bash
cd backend
cp .env.example .env            # DIRECTUS_URL + admin creds (match docker-compose.yml)
npm install
npm run start:dev               # http://localhost:3000  (CMS must be up first)
```

Endpoints and shapes: `backend/API_CONTRACT.md` and `postman/`. Details: `backend/README.md`.

## 3. App (Expo iOS dev build)

Liquid Glass and Apple Maps need a **custom dev build** - Expo Go will not do.

```bash
cd app
cp .env.example .env            # set EXPO_PUBLIC_API_URL (the backend, not Directus)
npm install
npx expo prebuild -p ios        # generate the native iOS project
npx expo run:ios                # build + launch the dev client on simulator/device
```

- **Simulator:** `EXPO_PUBLIC_API_URL=http://localhost:3000` works.
- **Physical device:** use your Mac's LAN IP, e.g. `http://192.168.1.20:3000`, and make sure the phone is on the same network. The backend has CORS open for dev.

Once running, subsequent JS changes: `npm start` (dev client).

## 4. Auth

- **Email/password:** create an App User in the Directus admin (or enable public registration), then sign in from the app's `Save your taste` screen. The app posts to the BFF `/v1/auth/login`, which proxies Directus.
- **Sign in with Apple:** the app obtains the Apple credential and posts it to the BFF `/v1/auth/apple`. That endpoint returns 501 until an Apple provider/flow is provisioned in Directus - complete the token exchange there (see `backend` AuthModule) plus Xcode's "Sign in with Apple" capability. Single clearly-marked seam; the button is wired end-to-end for that moment.

## 5. Storage: local to R2

Dev uses Directus local file storage. Production R2 is provisioned by Terraform (`terraform/main.tf` creates the bucket; `terraform/railway.tf` sets the Directus `STORAGE_*` vars). Notes: `REGION` must be `auto`; the `ENDPOINT` is the account-level URL with no bucket in the path; the driver stays `s3` even though the location is named `r2`. The bucket stays private - images are served through the BFF `/v1/assets`, which streams from Directus. See `docs/INFRASTRUCTURE.md`.

## Design language

Warm editorial luxury: photography-led, restrained, one terracotta accent, high-contrast serif for editorial moments against crisp SF Pro UI. All values live in `mobile/src/theme/tokens.ts` (single source of truth). The display serif ships as Playfair Display (a license-free stand-in for the Canela / Reckless vibe); drop the licensed `.otf` files into `mobile/assets/fonts` and re-point `mobile/src/theme/fonts.ts` - no call sites change.

## Screens

- **Map (home / heart)** - Apple Maps plotting curated places, branded per-category pins, floating glass filters + locate-me, glass preview card on tap.
- **Discover** - editorial surface: featured pick + an occasion rail.
- **Place detail** - full-bleed hero, serif name, review + pull-quote, tags/occasions, Book action (opens `booking_url`).
- **Onboarding** - short taste intro, persisted to `taste_profiles`.

## Deferred (extension points left in place)

favourites, custom lists, 5-level ratings, the Passport, Plans, group swipe-matching, likes / creator lists, seasonal-drop automation, activities/experience booking. The data model and code carry neutral shapes + comments so these slot in without rework. Search the codebase for `EXTENSION POINT` and `ponytail:` to find the seams.

## Map provider isolation

`expo-maps` (Apple provider) is alpha. It sits behind a thin wrapper at `mobile/src/map/MapView.tsx` - the rest of the app only knows that interface, so `react-native-maps` (Apple provider) or a custom SwiftUI MapKit module can replace it without touching any screen.
