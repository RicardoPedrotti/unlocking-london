# Infrastructure - Unlocking London

> Source of truth for deployment topology. Any change to `terraform/`,
> `docker-compose.yml`, `backend/railway.json`, `backend/.env.example`, or
> `tools/directus/schema.mjs` must update this doc in the same change.

## Topology

```
 iPhone (Expo app)
      │  https, Bearer token
      ▼
 backend  ── NestJS BFF gateway (Railway service "api")
      │  admin session (reads) / forwarded user Bearer (/me)
      ▼
 directus ── headless CMS + data API (Railway service "directus")
      │  DB_CONNECTION_STRING (private network)
      ▼
 postgres ── Railway service "postgres" (volume postgres-data)

 directus uploads ─────────────▶ Cloudflare R2 (bucket unlockinglondon-assets)
 app images  ◀── backend /v1/assets streams from directus/assets (bucket stays private)
```

The app talks ONLY to the backend. Directus and the R2 bucket are never exposed
to clients directly.

## Components

| Component | Where | Provisioned by |
|-----------|-------|----------------|
| Backend API (BFF) | Railway service `api`, built from repo `backend/` | `terraform/railway.tf` + `backend/railway.json` (deploy settings) |
| Directus CMS/API | Railway service `directus` (`directus/directus:11`) | `terraform/railway.tf` |
| Postgres | Railway service `postgres` (`postgres-ssl:17`), volume `postgres-data` | `terraform/railway.tf` |
| Object storage | Cloudflare R2 bucket `unlockinglondon-assets` | `terraform/main.tf` |

## Environments

| | Local | Railway (prod) |
|---|---|---|
| Postgres | docker-compose `postgres:16-alpine`, `localhost:5432` | `postgres.railway.internal:5432` (private) |
| Directus | docker-compose, `localhost:8055`, local file storage | Railway `directus`, R2 storage under `directus/` |
| Backend | `npm run start:dev`, `localhost:3000` | Railway `api`, NIXPACKS per `railway.json`, `/v1/health` probe |
| Directus schema/seed | `cd tools/directus && npm run setup` (points at localhost) | run `setup` against the Directus public URL (admin creds from tfvars) |
| App API URL | `EXPO_PUBLIC_API_URL=http://localhost:3000` (LAN IP on device) | `https://<api_subdomain>.up.railway.app` (baked into EAS build) |

## Secrets

| Secret | Local | Prod |
|--------|-------|------|
| Directus admin | inlined in `docker-compose.yml` (`admin@unlockinglondon.com` / `admin-dev-pw`) | `directus_admin_*` in `terraform.tfvars` (rotate in Directus after first login) |
| Directus KEY/SECRET | inlined dev values | `random_password` in Terraform state + Railway vars |
| Postgres password | inlined dev value | `random_password` in Terraform state + Railway vars |
| R2 S3 creds | n/a (local file storage) | `backend_env` map in `terraform.tfvars` (shared by api + directus) |
| Terraform auth | n/a | `CLOUDFLARE_API_TOKEN` + `RAILWAY_TOKEN` (account token) in gitignored `terraform/.env` |
| TF state backend creds | n/a | `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (= the R2 keypair) in gitignored `terraform/.env` |

Terraform state lives in a private R2 bucket `unlockinglondon-tfstate` (S3 backend
in `main.tf`, key `unlocking-london/terraform.tfstate`, `use_lockfile` locking). It
holds the DB password + Directus secrets, so the bucket is private and separate
from the public assets bucket. The bucket was created out-of-band (not TF-managed)
to avoid a circular dependency. Backend creds come from `AWS_*` env in
`terraform/.env`; run `set -a; source .env; set +a` before any terraform command.
The stale `terraform/*.tfstate` local files are gitignored backups from before the
migration.

## Data flow notes

- **Reads:** backend caches a Directus admin session, queries `/items/*` with a
  `status=published` filter, flattens M2M junctions (`tools`/`backend` normalize), returns raw JSON.
- **Auth:** `/v1/auth/login|refresh|logout` proxy Directus `/auth/*`. `/v1/me/*` forward the
  user's Bearer so Directus enforces per-user permissions. Sign in with Apple (`/v1/auth/apple`)
  returns 501 until an Apple provider/flow is provisioned in Directus (extension point in the AuthModule).
- **Assets:** `/v1/assets/:id` streams from Directus `/assets/:id` (transform query passed through),
  so the bucket stays private.
- **Editorial:** operators edit places/reviews in the Directus admin; published items appear in the app on next fetch.

## Runbooks

- **Deploy backend:** push to `main` -> Railway rebuilds `api` (root `backend/`) via NIXPACKS.
- **Infra change:** edit `terraform/*.tf` + `terraform.tfvars` -> `cd terraform && terraform plan && terraform apply`. Do not hand-edit the Railway dashboard.
- **Directus schema change:** edit `tools/directus/schema.mjs` -> re-run `npm run bootstrap` against the target Directus. Update this doc.
- **Seed content:** edit `data/catalog.json` -> `cd tools/directus && npm run seed`.
- **Storage local -> R2:** local uses Directus file storage; prod R2 is set by Terraform on the `directus` service (`STORAGE_*`). Notes: `REGION=auto`, endpoint is account-level (no bucket in path), driver stays `s3`.

## Known quirks

- Railway community provider volume race on first `postgres` create: apply may fail with "inconsistent result" and taint the service - the volume IS created. `terraform untaint` and re-apply; do NOT let a tainted plan destroy the service (the volume holds the DB).
- Directus private-network reachability: Railway injects its own `PORT` (defaults to 8080) and private networking is IPv6-only. The BFF calls `directus.railway.internal:8055`, so the `directus` service pins `PORT=8055` and `HOST=::` (in `terraform/railway.tf`). Without both, the BFF gets `fetch failed` on every Directus call and routes 500.
- `expo-maps` is alpha (dev-build only, iOS 18+). Isolated behind `mobile/src/map/MapView.tsx`.

## Update checklist (per change)

- [ ] `terraform plan` clean after infra changes (no surprise drift)
- [ ] Postman collection updated if backend routes changed
- [ ] This doc updated if topology/secrets/runbooks changed
- [ ] `backend/.env.example` updated if a new env var was introduced
