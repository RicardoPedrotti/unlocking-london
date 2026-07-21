output "assets_bucket" {
  value = cloudflare_r2_bucket.assets.name
}

output "assets_public_base_url" {
  description = "Public base URL for Directus assets (managed r2.dev domain)"
  value       = "https://${cloudflare_r2_managed_domain.assets.domain}"
}

output "r2_s3_endpoint" {
  description = "S3 API endpoint for R2 (R2_ACCOUNT_ID is enough; shown for reference)"
  value       = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
}

output "api_url" {
  description = "Public URL of the NestJS BFF (set as EXPO_PUBLIC_API_URL in mobile)"
  value       = "https://${railway_service_domain.api.domain}"
}

output "directus_url" {
  description = "Directus admin / data API URL"
  value       = "https://${railway_service_domain.directus.domain}"
}

output "database_url_external" {
  description = "External connection string (via TCP proxy) - use to inspect the DB: psql $(terraform output -raw database_url_external)"
  value       = "postgresql://directus:${random_password.postgres.result}@${railway_tcp_proxy.postgres.domain}:${railway_tcp_proxy.postgres.proxy_port}/unlocking_london"
  sensitive   = true
}
