terraform {
  required_version = ">= 1.5"

  # Remote state in a PRIVATE R2 bucket (S3-compatible). Holds the prod DB
  # password + Directus secrets, so it must never be the public assets bucket.
  # Bucket created out-of-band (not TF-managed) to avoid a circular dependency.
  # Creds come from AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env (the R2 keypair);
  # never hardcode them here. R2 needs the skip_* flags + path style; use_lockfile
  # gives S3-native locking via R2 conditional writes.
  backend "s3" {
    bucket = "unlockinglondon-tfstate"
    key    = "unlocking-london/terraform.tfstate"
    region = "auto"
    endpoints = {
      s3 = "https://6e0f6a280d46feceb7fc97f6db1a18aa.r2.cloudflarestorage.com"
    }
    use_path_style              = true
    use_lockfile                = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }

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
