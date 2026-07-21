# Unlocking London - BFF

A thin NestJS backend-for-frontend that the iOS/Expo app talks to. It fronts a
private Directus CMS: the app only ever hits this backend, and Directus is never
publicly exposed.

- Public content (`/places`, `/categories`, `/occasions`, `/assets`) is read
  from Directus using a cached **admin session** held server-side.
- User calls (`/me/*`) forward the app user's `Authorization: Bearer` token to
  Directus so Directus enforces per-user permissions.

## Requirements

- Node 20+
- Directus must be running first (see `../directus`).

## Setup

```bash
cp .env.example .env      # then edit if needed
npm install
npm run start:dev
```

The server listens on `PORT` (default 3000) under the global prefix `/v1`.

### Environment

| var | default | notes |
| --- | --- | --- |
| `PORT` | `3000` | |
| `DIRECTUS_URL` | `http://localhost:8055` | use `http://directus:8055` inside docker-compose |
| `DIRECTUS_ADMIN_EMAIL` | `admin@unlockinglondon.com` | admin used for public content reads |
| `DIRECTUS_ADMIN_PASSWORD` | `admin-dev-pw` | |

## Endpoints (all under `/v1`)

| method | path | auth | notes |
| --- | --- | --- | --- |
| GET | `/places` | - | published places, normalized |
| GET | `/places/:id` | - | one place, 404 if missing/unpublished |
| GET | `/categories` | - | |
| GET | `/occasions` | - | |
| POST | `/auth/login` | - | `{ access_token, refresh_token, expires }` |
| POST | `/auth/refresh` | - | |
| POST | `/auth/logout` | - | 204 |
| POST | `/auth/apple` | - | 501 until Apple flow exists (extension point) |
| GET | `/me` | Bearer | `{ id, email, first_name }` |
| GET | `/me/taste-profile` | Bearer | `TasteProfile \| null` |
| PUT | `/me/taste-profile` | Bearer | create-or-update, one per user |
| GET | `/assets/:id?width=&height=&quality=&fit=` | - | streams the Directus image |

## Normalization check

The M2M-junction flattening lives in one pure function (`src/common/normalize.js`).
Run its self-check with plain node (no test framework):

```bash
node src/common/normalize.check.mjs
```

## Production

The app points at this backend; Directus stays internal (not publicly reachable).
Build and run:

```bash
npm run build
npm start
```

Or use the provided `Dockerfile` (`node:20-alpine`, builds then runs `dist/main.js`).
