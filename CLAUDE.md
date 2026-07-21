# Unlocking London - repo conventions

Premium, iOS-only curated guide to London. Monorepo, three tiers plus infra.

## Structure

```
mobile/     Expo iOS app (expo-router, Liquid Glass, Apple Maps). Talks ONLY to backend.
backend/    NestJS BFF gateway. Fronts Directus; app's single point of contact.
tools/      Maintenance scripts. tools/directus = Directus schema bootstrap + seed (its IaC).
data/       Canonical seed JSON (data/catalog.json) - single source of truth for seeded places.
terraform/  Railway + Cloudflare R2 IaC (provisioning only; service settings live in backend/railway.json).
postman/    API collection mirroring the backend routes.
docs/       INFRASTRUCTURE.md = deployment-topology source of truth.
docker-compose.yml   Local Postgres + Directus. Backend + app run via npm, not compose.
```

Data flow: `mobile -> backend (BFF) -> directus -> postgres`. Directus is the data API + editorial CMS; the BFF proxies it and keeps Directus + the R2 bucket private. Assets are served via the BFF `/v1/assets`.

## Run (local)

```bash
docker compose up -d                       # Postgres + Directus
cd tools/directus && npm install && npm run setup   # provision schema + seed places
cd ../../backend && cp .env.example .env && npm install && npm run start:dev   # BFF on :3000
cd ../mobile && cp .env.example .env && npm install && npx expo prebuild -p ios && npx expo run:ios
```

## Keep-in-sync contracts (enforced by review, not CI)

1. **Postman.** Any change to `backend/src/**` routes/controllers MUST update `postman/unlocking-london.postman_collection.json` in the SAME change. One folder per controller; add/rename/remove requests to match; add a collection variable for any new path param. The collection is authenticated by a `{{accessToken}}` bearer var that the Auth > login request populates.

2. **Infrastructure docs.** Any change to `terraform/`, `docker-compose.yml`, `backend/railway.json`, `backend/.env.example`, or `tools/directus/schema.mjs` MUST update `docs/INFRASTRUCTURE.md` in the SAME change. It is the source of truth for topology, secrets, and runbooks.

## Conventions

- Directus schema is owned by `tools/directus/schema.mjs` (idempotent SDK bootstrap), NOT by SQL and NOT by the backend. Seed data is `data/catalog.json`, applied by `tools/directus/seed.mjs`.
- Backend is a thin gateway: no DB of its own, no ORM. It reads Directus with a cached admin session and forwards the user's Bearer for `/me/*`. Response envelopes from Directus (`{data}`) are unwrapped before returning.
- Design tokens live only in `mobile/src/theme/tokens.ts`. Never hardcode colour/type/spacing.
- Deferred features (favourites, lists, ratings, Passport, Plans, swipe) are left as commented extension points. Search `EXTENSION POINT` and `ponytail:`.
- Writing style: plain hyphens only, never em/en-dashes. Never run `git commit` - stage and ask.
- Secrets: local dev values are inlined in `docker-compose.yml`. Prod secrets live in gitignored `terraform/terraform.tfvars` and are pushed to Railway via `terraform apply` - never hand-edit the Railway dashboard.
