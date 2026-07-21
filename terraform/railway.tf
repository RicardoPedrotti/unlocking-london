# Railway: project + Postgres + Directus (data API) + NestJS BFF.
# Auth via RAILWAY_TOKEN env var - needs an ACCOUNT token
# (railway.com/account/tokens), not a project token.
#
# Community provider (terraform-community-providers/railway). Day-to-day
# service settings (healthcheck, restart policy, build) stay in each service's
# railway.json per the provider's own recommendation - Terraform owns
# provisioning only.
#
# Three-tier shape: mobile -> api (NestJS BFF) -> directus (headless CMS =
# data API) -> postgres. Directus is the data layer the BFF proxies; it also
# stores its own uploads in the shared R2 bucket.
provider "railway" {}

resource "railway_project" "unlocking_london" {
  name        = "unlocking-london"
  description = "Unlocking London - NestJS BFF + Directus + Postgres"
}

locals {
  environment_id = railway_project.unlocking_london.default_environment.id

  # Private-network connection string to the shared Postgres. Reused by Directus
  # (the data API) so there is one source of truth for the DB URL.
  pg_internal_url = "postgresql://directus:${random_password.postgres.result}@postgres.railway.internal:5432/unlocking_london"

  # Private-network URL of Directus for the BFF. Internal traffic stays inside
  # the Railway network (no public egress, no TLS overhead). Railway serves the
  # Directus container on port 8055 over the private DNS name.
  directus_internal_url = "http://directus.railway.internal:8055"
}

# ── Postgres ──────────────────────────────────────────────────────────────────

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "railway_service" "postgres" {
  name         = "postgres"
  project_id   = railway_project.unlocking_london.id
  source_image = "ghcr.io/railwayapp-templates/postgres-ssl:17"

  # Provider v0.6.2 quirk: on first create the volume is provisioned async and
  # the read-back races, failing apply with "inconsistent result" and tainting
  # the service. The volume IS created - untaint and re-apply; refresh then
  # reads it consistently. Do NOT let a tainted plan destroy this service: the
  # volume holds the database.
  volume = {
    name       = "postgres-data"
    mount_path = "/var/lib/postgresql/data"
  }
}

resource "railway_variable_collection" "postgres" {
  environment_id = local.environment_id
  service_id     = railway_service.postgres.id

  variables = [
    { name = "POSTGRES_USER", value = "directus" },
    { name = "POSTGRES_PASSWORD", value = random_password.postgres.result },
    { name = "POSTGRES_DB", value = "unlocking_london" },
    # PGDATA must be a subdirectory of the volume mount
    { name = "PGDATA", value = "/var/lib/postgresql/data/pgdata" },
  ]
}

# Public TCP endpoint so migrations / psql can reach the DB from outside the
# private network. App traffic stays on postgres.railway.internal.
resource "railway_tcp_proxy" "postgres" {
  application_port = 5432
  environment_id   = local.environment_id
  service_id       = railway_service.postgres.id
}

# ── Directus (headless CMS = data API) ────────────────────────────────────────
# Directus IS the data API here: the NestJS BFF proxies it. Self-hosted against
# the shared Postgres; keeps its own metadata in directus_* tables and stores
# uploads in the shared R2 bucket under directus/.

resource "random_password" "directus_key" {
  length  = 32
  special = false
}

resource "random_password" "directus_secret" {
  length  = 32
  special = false
}

resource "railway_service" "directus" {
  name         = "directus"
  project_id   = railway_project.unlocking_london.id
  source_image = "directus/directus:11"
}

resource "railway_service_domain" "directus" {
  subdomain      = var.directus_subdomain
  environment_id = local.environment_id
  service_id     = railway_service.directus.id
}

resource "railway_variable_collection" "directus" {
  environment_id = local.environment_id
  service_id     = railway_service.directus.id

  variables = [
    # Directus core secrets (arbitrary 32-byte strings).
    { name = "KEY", value = random_password.directus_key.result },
    { name = "SECRET", value = random_password.directus_secret.result },

    # Railway injects its own PORT (defaults to 8080) and private networking is
    # IPv6-only. Pin PORT to 8055 so the BFF's directus.railway.internal:8055
    # link is correct, and bind :: so service-to-service traffic resolves.
    { name = "PORT", value = "8055" },
    { name = "HOST", value = "::" },

    # Shared Postgres over the private network (plaintext internal link → no SSL).
    { name = "DB_CLIENT", value = "pg" },
    { name = "DB_CONNECTION_STRING", value = local.pg_internal_url },
    { name = "DB_SSL", value = "false" },

    { name = "PUBLIC_URL", value = "https://${railway_service_domain.directus.domain}" },

    # First-boot admin (rotate the password after first login). Set in tfvars.
    { name = "ADMIN_EMAIL", value = var.directus_admin_email },
    { name = "ADMIN_PASSWORD", value = var.directus_admin_password },

    # CORS open so the BFF and browser clients can call the API.
    { name = "CORS_ENABLED", value = "true" },
    { name = "CORS_ORIGIN", value = "true" },

    # Uploads → the shared R2 bucket, namespaced under directus/. Reuses the same
    # R2 creds kept in backend_env.
    { name = "STORAGE_LOCATIONS", value = "r2" },
    { name = "STORAGE_R2_DRIVER", value = "s3" },
    { name = "STORAGE_R2_KEY", value = var.backend_env["R2_ACCESS_KEY_ID"] },
    { name = "STORAGE_R2_SECRET", value = var.backend_env["R2_SECRET_ACCESS_KEY"] },
    { name = "STORAGE_R2_BUCKET", value = var.backend_env["R2_BUCKET"] },
    { name = "STORAGE_R2_ENDPOINT", value = "https://${var.backend_env["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com" },
    { name = "STORAGE_R2_REGION", value = "auto" },
    { name = "STORAGE_R2_FORCE_PATH_STYLE", value = "true" },
    { name = "STORAGE_R2_ROOT", value = "directus" },
  ]
}

# ── API (NestJS BFF) ──────────────────────────────────────────────────────────
# Thin backend-for-frontend the mobile app talks to. It proxies Directus for
# data and logs into Directus with the same admin creds.

resource "railway_service" "api" {
  name               = "api"
  project_id         = railway_project.unlocking_london.id
  source_repo        = "RicardoPedrotti/unlocking-london"
  source_repo_branch = "main"
  root_directory     = "backend"
}

resource "railway_service_domain" "api" {
  subdomain      = var.api_subdomain
  environment_id = local.environment_id
  service_id     = railway_service.api.id
}

resource "railway_variable_collection" "api" {
  environment_id = local.environment_id
  service_id     = railway_service.api.id

  variables = concat(
    [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3000" },
      # Talk to Directus over the private network - no public egress, no TLS
      # overhead. Swap to https://${railway_service_domain.directus.domain} only
      # if the BFF ever runs outside the Railway private network.
      { name = "DIRECTUS_URL", value = local.directus_internal_url },
      { name = "DIRECTUS_ADMIN_EMAIL", value = var.directus_admin_email },
      { name = "DIRECTUS_ADMIN_PASSWORD", value = var.directus_admin_password },
    ],
    [for k, v in var.backend_env : { name = k, value = v }],
  )
}
