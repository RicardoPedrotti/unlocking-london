terraform {
  required_version = ">= 1.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.6"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# Auth via CLOUDFLARE_API_TOKEN env var (never commit tokens).
# Token needs: Account > Workers R2 Storage > Edit.
provider "cloudflare" {}

# ── Directus asset bucket ─────────────────────────────────────────────────────
# Directus stores all uploaded assets here (STORAGE_LOCATIONS=r2, root "directus").

resource "cloudflare_r2_bucket" "assets" {
  account_id = var.cloudflare_account_id
  name       = var.assets_bucket_name
  location   = var.r2_location
}

# CORS: presigned PUTs from native mobile don't need CORS, but Expo web and
# local browser testing do. Tighten allowed origins when a web app ships.
resource "cloudflare_r2_bucket_cors" "assets" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.assets.name

  rules = [{
    allowed = {
      methods = ["GET", "PUT"]
      origins = ["*"]
      headers = ["content-type"]
    }
    max_age_seconds = 3600
  }]
}

# Public read access via the managed r2.dev subdomain (rate-limited, fine for
# dev/small scale). For production, switch to a custom domain on your zone -
# free egress through Cloudflare's CDN and cacheable:
#
# resource "cloudflare_r2_custom_domain" "assets" {
#   account_id  = var.cloudflare_account_id
#   bucket_name = cloudflare_r2_bucket.assets.name
#   domain      = "assets.unlockinglondon.com"
#   zone_id     = var.cloudflare_zone_id
#   enabled     = true
# }
resource "cloudflare_r2_managed_domain" "assets" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.assets.name
  enabled     = true
}
