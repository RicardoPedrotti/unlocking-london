variable "cloudflare_account_id" {
  description = "Cloudflare account id (dashboard → R2 → right sidebar)"
  type        = string
}

variable "assets_bucket_name" {
  description = "R2 bucket for Directus-managed assets"
  type        = string
  default     = "unlockinglondon-assets"
}

variable "r2_location" {
  description = "R2 location hint (WNAM, ENAM, WEUR, EEUR, APAC)"
  type        = string
  default     = "WEUR"
}

variable "api_subdomain" {
  description = "Railway-provided subdomain for the API (<subdomain>.up.railway.app)"
  type        = string
  default     = "unlockinglondon-api"
}

variable "directus_subdomain" {
  description = "Railway subdomain for the Directus CMS (<subdomain>.up.railway.app)"
  type        = string
  default     = "unlockinglondon-directus"
}

variable "directus_admin_email" {
  description = "Directus first-boot admin email (also the BFF login). Set in terraform.tfvars."
  type        = string
  default     = ""
}

variable "directus_admin_password" {
  description = "Directus first-boot admin password (also the BFF login) - use a strong value; rotate after first login. Set in terraform.tfvars."
  type        = string
  sensitive   = true
  default     = ""
}

# App secrets injected into the api service. Set in terraform.tfvars
# (gitignored). Directus also reads the R2_* keys from here for its storage.
# Expected keys: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
# R2_BUCKET, plus any Apple sign-in vars (APPLE_CLIENT_ID / APPLE_CLIENT_SECRET
# / APPLE_TEAM_ID / APPLE_KEY_ID) for later.
variable "backend_env" {
  description = "Environment variables for the api service (secrets - keep in terraform.tfvars)"
  type        = map(string)
  sensitive   = true
  default     = {}
}
